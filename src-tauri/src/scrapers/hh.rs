use crate::models::Vacancy;
use reqwest::Client;
use serde_json::Value;

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
    // Стучимся напрямую в официальный API базы данных HH!
    let url = format!("https://api.hh.ru/vacancies?text={}&page={}&per_page=20", safe_query, page);
    
    let response = client.get(&url).header("User-Agent", ua).send().await.map_err(|e| e.to_string())?;
    let text = response.text().await.map_err(|e| e.to_string())?;
    
    if let Ok(json) = serde_json::from_str::<Value>(&text) {
        if let Some(items) = json.get("items").and_then(|i| i.as_array()) {
            for v in items {
                let title = v.get("name").and_then(|n| n.as_str()).unwrap_or("").to_string();
                let link = v.get("alternate_url").and_then(|l| l.as_str()).unwrap_or("").to_string();
                
                if title.is_empty() || link.is_empty() { continue; }
                
                let company = v.get("employer")
                    .and_then(|e| e.get("name"))
                    .and_then(|n| n.as_str())
                    .unwrap_or("Компания не указана")
                    .to_string();
                
                let mut salary = String::new(); // По умолчанию пустота
                
                if let Some(sal_obj) = v.get("salary").and_then(|s| s.as_object()) {
                    let min = sal_obj.get("from").and_then(|m| m.as_i64()).unwrap_or(0);
                    let max = sal_obj.get("to").and_then(|m| m.as_i64()).unwrap_or(0);
                    let currency = sal_obj.get("currency").and_then(|c| c.as_str()).unwrap_or("₽")
                        .replace("RUR", "₽").replace("RUB", "₽"); // HH отдает валюту кодом
                    
                    let format_num = |n: i64| -> String {
                        let s = n.to_string();
                        let mut res = String::new();
                        for (i, c) in s.chars().rev().enumerate() {
                            if i > 0 && i % 3 == 0 { res.push(' '); }
                            res.push(c);
                        }
                        res.chars().rev().collect()
                    };

                    if min > 0 && max > 0 {
                        salary = format!("от {} до {} {}", format_num(min), format_num(max), currency);
                    } else if min > 0 {
                        salary = format!("от {} {}", format_num(min), currency);
                    } else if max > 0 {
                        salary = format!("до {} {}", format_num(max), currency);
                    }
                }
                
                results.push(Vacancy { title, link, company, salary });
            }
        }
    }
    Ok(results)
}