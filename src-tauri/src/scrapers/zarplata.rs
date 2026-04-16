use crate::models::Vacancy;
use reqwest::Client;
use scraper::{Html, Selector};

pub async fn scrape(
    client: &Client, query: &str, page: u32, _location: &str, _work_format: &str,
) -> Result<Vec<Vacancy>, String> {
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    
    let safe_query = query.replace(" ", "%20");
    let url = format!("https://zarplata.ru/vacancies?q={}&page={}", safe_query, page + 1);
    
    let response = client.get(&url).header("User-Agent", ua).send().await.map_err(|e| e.to_string())?;
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    let format_salary = |s: &str| -> String {
        let mut text = s.replace("руб.", "₽").replace("руб", "₽")
                        .replace(" — ", " до ").replace(" - ", " до ").replace(" – ", " до ")
                        .replace(" ", " ").replace(" ", " ");
        while text.contains("  ") { text = text.replace("  ", " "); }
        let lower = text.to_lowercase().trim().to_string();
        if lower.contains(" до ") && !lower.starts_with("от ") && !lower.starts_with("до ") {
            text = format!("от {}", text.trim());
        }
        text.trim().to_string()
    };

    let card_selector = Selector::parse("[data-qa='vacancy-serp__vacancy'], [data-qa='vacancy-serp__vacancy_premium'], .vacancy-card, .vacancy-item").unwrap();
    let title_selector = Selector::parse("[data-qa='serp-item__title'], h2 a, h3 a").unwrap();
    let company_selector = Selector::parse("[data-qa='vacancy-serp__vacancy-employer'], a[href*='/companies/']").unwrap();
    let salary_selector = Selector::parse("[data-qa='vacancy-serp__vacancy-compensation'], .salary, .compensation").unwrap();

    for element in document.select(&card_selector) {
        if let Some(t_el) = element.select(&title_selector).next() {
            let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
            if title.is_empty() { continue; }

            let raw_link = t_el.value().attr("href").unwrap_or("");
            let link = if raw_link.starts_with('/') { format!("https://zarplata.ru{}", raw_link) } else { raw_link.to_string() };
            
            let company = element.select(&company_selector).next()
                .map(|c| c.text().collect::<Vec<_>>().join(" ").trim().replace(" ", " "))
                .unwrap_or_else(|| "Компания не указана".to_string());
                
            let mut salary = element.select(&salary_selector).next()
                .map(|s| s.text().collect::<Vec<_>>().join(" ").trim().to_string())
                .unwrap_or_else(|| "".to_string());
            
            if salary.is_empty() {
                let spans = Selector::parse("span").unwrap();
                for span in element.select(&spans) {
                    // ИСПРАВЛЕНО: Добавлен .to_string() прямо сюда, чтобы владеть памятью!
                    let text = span.text().collect::<Vec<_>>().join(" ").trim().to_string();
                    if text.contains("₽") || text.to_lowercase().contains("договоренности") {
                        salary = text; 
                        break;
                    }
                }
            }
            
            if salary.to_lowercase().contains("не указана") || salary.to_lowercase().contains("договоренности") {
                salary = "".to_string();
            } else if !salary.is_empty() {
                salary = format_salary(&salary);
            }
            
            results.push(Vacancy { title, link, company, salary });
        }
    }
    Ok(results)
}