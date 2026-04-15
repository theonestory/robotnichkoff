use crate::models::Vacancy;
use reqwest::Client;
use scraper::{Html, Selector};

pub async fn scrape(
    client: &Client,
    query: &str,
    page: u32,
    _location: &str,
    _work_format: &str,
) -> Result<Vec<Vacancy>, String> {
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36";
    
    let safe_query = query.replace(" ", "%20");
    let url = format!("https://russia.superjob.ru/vacancy/search/?keywords={}&page={}", safe_query, page + 1);
    
    let response = client.get(&url).header("User-Agent", ua).send().await.map_err(|e| e.to_string())?;
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    // Тот самый конвертер ЗП: наводим красоту ("40 000 — 70 000 ₽" -> "от 40 000 до 70 000 ₽")
    let format_salary_string = |s: &str| -> String {
        let mut text = s.replace(" — ", " до ")
                        .replace(" - ", " до ")
                        .replace(" – ", " до ")
                        .replace(" ", " "); // Вычищаем неразрывные пробелы
                        
        while text.contains("  ") {
            text = text.replace("  ", " ");
        }
        
        let lower = text.to_lowercase().trim().to_string();
        if lower.contains(" до ") && !lower.starts_with("от ") && !lower.starts_with("до ") {
            text = format!("от {}", text.trim());
        }
        
        text.trim().to_string()
    };

    let card_selectors = vec![".f-test-search-result-item", ".f-test-vacancy-item", "[class*='vacancy-item']"];
    let mut parsed_any = false;

    for selector_str in card_selectors {
        if let Ok(card_sel) = Selector::parse(selector_str) {
            for element in document.select(&card_sel) {
                let title_sel = Selector::parse("a[href^='/vakansii/'], span a, h3 a, h2 a").unwrap();
                if let Some(t_el) = element.select(&title_sel).next() {
                    let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
                    if title.is_empty() { continue; }

                    let raw_link = t_el.value().attr("href").unwrap_or("");
                    let link = if raw_link.starts_with('/') { format!("https://russia.superjob.ru{}", raw_link) } else { raw_link.to_string() };
                    
                    let company_sel = Selector::parse("a[href^='/clients/'], span.f-test-text-company-item-company-name, span.f-test-text-vacancy-item-company-name").unwrap();
                    let mut company = element.select(&company_sel)
                        .next()
                        .map(|c| c.text().collect::<Vec<_>>().join(" ").trim().to_string())
                        .unwrap_or_else(|| "Компания не указана".to_string());
                        
                    let salary_sel = Selector::parse("span.f-test-text-company-item-salary, span.f-test-text-vacancy-item-salary").unwrap();
                    let mut salary = element.select(&salary_sel)
                        .next()
                        .map(|s| s.text().collect::<Vec<_>>().join(" ").trim().replace(" ", " ").to_string())
                        .unwrap_or_else(|| "".to_string());
                    
                    // Резервный способ: если не нашли ЗП, ищем любой текст со знаком ₽
                    if salary.is_empty() {
                        let spans = Selector::parse("span").unwrap();
                        for span in element.select(&spans) {
                            let text = span.text().collect::<Vec<_>>().join(" ").trim().replace(" ", " ");
                            if text.contains("₽") || text.to_lowercase().contains("договоренности") {
                                salary = text;
                                break;
                            }
                        }
                    }

                    // Защита от дурака: если ЗП всё равно пролезла в Компанию — стираем её оттуда
                    if company.contains("₽") || company.contains("руб") {
                        company = "Компания не указана".to_string();
                    }
                    
                    if salary.to_lowercase().contains("договоренности") || salary.to_lowercase().contains("не указана") {
                        salary = "".to_string();
                    } else if !salary.is_empty() {
                        // Пропускаем зарплату через наш бьюти-фильтр!
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