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
    
    let safe_query = query.replace(" ", "%20");
    let url = format!("https://opendata.trudvsem.ru/api/v1/vacancies?text={}&offset={}&limit=20", safe_query, page);
    
    let response = client.get(&url).send().await.map_err(|e| e.to_string())?;
    let text = response.text().await.map_err(|e| e.to_string())?;
    
    if let Ok(json) = serde_json::from_str::<Value>(&text) {
        if let Some(results_obj) = json.get("results").and_then(|r| r.as_object()) {
            if let Some(vacancies) = results_obj.get("vacancies").and_then(|v| v.as_array()) {
                for v_item in vacancies {
                    if let Some(v) = v_item.get("vacancy").and_then(|vac| vac.as_object()) {
                        let title = v.get("job-name").and_then(|t| t.as_str()).unwrap_or("").trim().to_string();
                        let link = v.get("vac_url").and_then(|l| l.as_str()).unwrap_or("").to_string();
                        
                        if title.is_empty() || link.is_empty() { continue; }
                        
                        let company = v.get("company")
                            .and_then(|c| c.get("name"))
                            .and_then(|n| n.as_str())
                            .unwrap_or("Компания не указана")
                            .trim()
                            .to_string();
                        
                        let mut salary = String::new(); // По умолчанию пустота (триггер для красной плашки и фильтров)
                        let sal_min = v.get("salary_min").and_then(|m| m.as_i64()).unwrap_or(0);
                        let sal_max = v.get("salary_max").and_then(|m| m.as_i64()).unwrap_or(0);
                        
                        let currency = v.get("currency").and_then(|c| c.as_str()).unwrap_or("₽")
                            .replace("руб.", "₽").replace("«", "").replace("»", "").replace("\"", "").trim().to_string();
                        
                        let format_num = |n: i64| -> String {
                            let s = n.to_string();
                            let mut res = String::new();
                            for (i, c) in s.chars().rev().enumerate() {
                                if i > 0 && i % 3 == 0 { res.push(' '); }
                                res.push(c);
                            }
                            res.chars().rev().collect()
                        };

                        // Логика ТрудВсем: если ЗП строго больше нуля, форматируем. Иначе оставляем пустой ("").
                        if sal_min > 0 && sal_max > 0 {
                            salary = format!("от {} до {} {}", format_num(sal_min), format_num(sal_max), currency);
                        } else if sal_min > 0 {
                            salary = format!("от {} {}", format_num(sal_min), currency);
                        } else if sal_max > 0 {
                            salary = format!("до {} {}", format_num(sal_max), currency);
                        } else if let Some(sal_str) = v.get("salary").and_then(|s| s.as_str()) {
                            // Дополнительная зачистка текстового поля от бюрократических нулей
                            let cleaned = sal_str.replace("«", "").replace("»", "").replace("руб.", "").replace("₽", "").trim().to_lowercase();
                            if cleaned != "0" && cleaned != "от 0" && cleaned != "до 0" && cleaned != "по договоренности" && !cleaned.is_empty() {
                                salary = sal_str.replace("«", "").replace("»", "").trim().to_string();
                            }
                        }
                        
                        results.push(Vacancy { title, link, company, salary });
                    }
                }
            }
        }
    }
    
    Ok(results)
}