use crate::models::Vacancy;
use reqwest::Client;
use scraper::{Html, Selector};

pub async fn scrape(
    client: &Client, query: &str, page: u32, _location: &str, _work_format: &str,
) -> Result<Vec<Vacancy>, String> {
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    
    let safe_query = query.replace(" ", "%20");
    let url = format!("https://www.rabota.ru/vacancy/?query={}&page={}", safe_query, page + 1);
    
    let response = client.get(&url)
        .header("User-Agent", ua)
        .header("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8")
        .header("Accept-Language", "ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7")
        .send().await.map_err(|e| e.to_string())?;
        
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    // ИСПРАВЛЕННЫЙ ФИЛЬТР ТИРЕ
    let format_salary_string = |s: &str| -> String {
        let mut text = s.replace("руб.", "₽")
                        .replace("руб", "₽")
                        .replace("—", " до ")
                        .replace("–", " до ")
                        .replace("-", " до ")
                        .replace(" ", " ")
                        .replace(" ", " "); 
                        
        while text.contains("  ") { text = text.replace("  ", " "); }
        
        let lower = text.to_lowercase().trim().to_string();
        if lower.contains(" до ") && !lower.starts_with("от ") && !lower.starts_with("до ") {
            text = format!("от {}", text.trim());
        }
        text.trim().to_string()
    };

    let card_selectors = vec!["article.vacancy", ".vacancy-preview-card", ".vacancy-card", ".r-card"];
    let mut parsed_any = false;

    for selector_str in card_selectors {
        if let Ok(card_sel) = Selector::parse(selector_str) {
            for element in document.select(&card_sel) {
                let title_sel = Selector::parse("h3 a, .vacancy-preview-card__title a, h2 a").unwrap();
                if let Some(t_el) = element.select(&title_sel).next() {
                    let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
                    if title.is_empty() { continue; }

                    let raw_link = t_el.value().attr("href").unwrap_or("");
                    let link = if raw_link.starts_with('/') { format!("https://www.rabota.ru{}", raw_link) } else { raw_link.to_string() };
                    
                    let company_sel = Selector::parse(".vacancy-preview-card__company-name a, .company-name").unwrap();
                    let company = element.select(&company_sel).next()
                        .map(|c| c.text().collect::<Vec<_>>().join(" ").trim().to_string())
                        .unwrap_or_else(|| "Компания не указана".to_string());
                        
                    let salary_sel = Selector::parse(".vacancy-preview-card__salary, .vacancy-salary").unwrap();
                    let mut salary = element.select(&salary_sel).next()
                        .map(|s| s.text().collect::<Vec<_>>().join(" ").trim().to_string())
                        .unwrap_or_else(|| "".to_string());
                    
                    if salary.to_lowercase().contains("договоренности") || salary.to_lowercase().contains("не указана") {
                        salary = "".to_string();
                    } else if !salary.is_empty() {
                        salary = format_salary_string(&salary);
                    }
                    
                    results.push(Vacancy { title, link, company, salary });
                    parsed_any = true;
                }
            }
        }
        if parsed_any { break; }
    }

    Ok(results)
}