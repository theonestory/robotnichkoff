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
    let url = format!("https://remote-job.ru/search?search%5Bquery%5D={}&search%5BsearchType%5D=vacancy&page={}", safe_query, page + 1);
    
    let response = client.get(&url).header("User-Agent", ua).send().await.map_err(|e| e.to_string())?;
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);
    
    // Используем точные теги с твоего скриншота!
    let card_selector = Selector::parse(".vacancy_item").unwrap(); // То самое нижнее подчеркивание
    let title_selector = Selector::parse("h2 a").unwrap();
    let company_selector = Selector::parse("small a").unwrap();
    let salary_selector = Selector::parse("h3").unwrap();

    for element in document.select(&card_selector) {
        if let Some(t_el) = element.select(&title_selector).next() {
            let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
            if title.is_empty() { continue; }

            let raw_link = t_el.value().attr("href").unwrap_or("");
            let link = if raw_link.starts_with('/') { format!("https://remote-job.ru{}", raw_link) } else { raw_link.to_string() };
            
            let company = element.select(&company_selector)
                .next()
                .map(|c| c.text().collect::<Vec<_>>().join(" ").trim().to_string())
                .unwrap_or_else(|| "Компания не указана".to_string());
                
            let mut salary = element.select(&salary_selector)
                .next()
                .map(|s| s.text().collect::<Vec<_>>().join(" ").trim().replace("&nbsp;", " ").to_string())
                .unwrap_or_else(|| "".to_string());
            
            let salary_clean = salary.to_lowercase();
            if salary_clean.contains("не указана") || salary_clean.contains("договоренности") || salary_clean == "0" {
                salary = "".to_string();
            }
            
            results.push(Vacancy { title, link, company, salary });
        }
    }
    Ok(results)
}