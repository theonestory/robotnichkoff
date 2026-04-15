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
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
    
    let url = format!("https://career.habr.com/vacancies?page={}&q={}&type=all", page + 1, query);
    
    let response = client.get(&url)
        .header("User-Agent", ua)
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    let card_selector = Selector::parse(".vacancy-card").unwrap();
    let title_selector = Selector::parse(".vacancy-card__title a").unwrap();
    let salary_selector = Selector::parse(".vacancy-card__salary, .basic-salary").unwrap();
    
    // Бронебойный селектор: ищем контейнер компании
    let company_wrapper = Selector::parse(".vacancy-card__company-title, .vacancy-card__company, .company_name, .company-name").unwrap();
    let a_selector = Selector::parse("a").unwrap();

    for element in document.select(&card_selector) {
        if let Some(t_el) = element.select(&title_selector).next() {
            let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
            if title.is_empty() { continue; }

            let raw_link = t_el.value().attr("href").unwrap_or("");
            let link = if raw_link.starts_with('/') { 
                format!("https://career.habr.com{}", raw_link) 
            } else { 
                raw_link.to_string() 
            };
            
            let mut company = String::from("Компания не указана");
            if let Some(wrapper) = element.select(&company_wrapper).next() {
                // В первую очередь пытаемся вытащить текст только из ссылки <a> (там нет рейтинга)
                if let Some(a_tag) = wrapper.select(&a_selector).next() {
                    company = a_tag.text().collect::<Vec<_>>().join(" ").trim().to_string();
                } else {
                    // Если ссылки нет, берем весь текст и отсекаем цифру рейтинга в конце
                    let text = wrapper.text().collect::<Vec<_>>().join(" ");
                    let mut words: Vec<&str> = text.split_whitespace().collect();
                    if let Some(last) = words.last() {
                        if last.parse::<f64>().is_ok() {
                            words.pop(); // Удаляем рейтинг
                        }
                    }
                    company = words.join(" ").trim().to_string();
                }
            }
            
            if company.is_empty() {
                company = "Компания не указана".to_string();
            }
                
            let salary = element.select(&salary_selector)
                .next()
                .map(|s| s.text().collect::<Vec<_>>().join(" ").trim().to_string())
                .unwrap_or_else(|| "".to_string()); // Оставляем ПУСТОЙ, чтобы фронт сам покрасил в красный
            
            results.push(Vacancy { title, link, company, salary });
        }
    }
    
    Ok(results)
}