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
    let url = format!("https://geekjob.ru/json/find/vacancy?page={}&qs={}", page + 1, safe_query);
    
    let response = client.get(&url)
        .header("User-Agent", ua)
        .header("Accept", "application/json")
        .header("Content-Type", "application/json")
        .header("Referer", "https://geekjob.ru/vacancies")
        .header("X-Requested-With", "XMLHttpRequest")
        .header("Sec-Fetch-Mode", "cors")
        .header("Sec-Fetch-Site", "same-origin")
        .send()
        .await
        .map_err(|e| e.to_string())?;
        
    let text = response.text().await.map_err(|e| e.to_string())?;
    
    let format_salary_string = |s: &str| -> String {
        let mut text = s.replace(" — ", " до ").replace(" - ", " до ");
        if text.contains(" до ") && !text.starts_with("от ") && !text.starts_with("От ") {
            text = format!("от {}", text);
        }

        let format_num = |n: f64| -> String {
            let num_str = (n.trunc() as i64).to_string();
            let mut res = String::new();
            for (i, c) in num_str.chars().rev().enumerate() {
                if i > 0 && i % 3 == 0 { res.push(' '); }
                res.push(c);
            }
            res.chars().rev().collect()
        };

        let mut words = Vec::new();
        for p in text.split_whitespace() {
            if p.ends_with('K') || p.ends_with('k') || p.ends_with('К') || p.ends_with('к') {
                let num_part = &p[..p.len()-1];
                if let Ok(num) = num_part.parse::<f64>() {
                    words.push(format_num(num * 1000.0));
                    continue;
                }
            }
            words.push(p.to_string());
        }
        words.join(" ")
    };
    
    if let Ok(json) = serde_json::from_str::<Value>(&text) {
        let mut items_array = None;
        
        if let Some(arr) = json.as_array() {
            items_array = Some(arr);
        } else if let Some(obj) = json.as_object() {
            for key in ["data", "items", "vacancies", "documents", "docs", "results", "list"] {
                if let Some(arr) = obj.get(key).and_then(|v| v.as_array()) {
                    items_array = Some(arr);
                    break;
                }
            }
            if items_array.is_none() {
                for v in obj.values() {
                    if let Some(arr) = v.as_array() {
                        if !arr.is_empty() && arr[0].is_object() {
                            items_array = Some(arr);
                            break;
                        }
                    }
                }
            }
        }

        if let Some(vacancies) = items_array {
            for v in vacancies {
                let title = v.get("title").or_else(|| v.get("name")).or_else(|| v.get("position"))
                    .and_then(|t| t.as_str()).unwrap_or("").trim().to_string();
                
                let id_val = v.get("id").or_else(|| v.get("_id")).or_else(|| v.get("alias")).or_else(|| v.get("hash"));
                let id = if let Some(val) = id_val {
                    if let Some(s) = val.as_str() { s.to_string() }
                    else if let Some(n) = val.as_i64() { n.to_string() }
                    else { "".to_string() }
                } else { "".to_string() };
                
                if title.is_empty() || id.is_empty() { continue; }

                let link = format!("https://geekjob.ru/vacancy/{}", id);
                
                let mut company = "Компания не указана".to_string();
                if let Some(comp) = v.get("company").and_then(|c| c.as_object()) {
                    if let Some(name) = comp.get("name").or_else(|| comp.get("title")).and_then(|n| n.as_str()) {
                        company = name.trim().to_string();
                    }
                } else if let Some(name) = v.get("companyName").or_else(|| v.get("employer")).and_then(|n| n.as_str()) {
                    company = name.trim().to_string();
                }

                let mut salary = String::new(); // По умолчанию отдаем пустоту для красного маркера во фронтенде!
                
                // Функция проверки на "мусор"
                let is_valid_salary = |s: &str| -> bool {
                    let c = s.trim().to_lowercase();
                    !c.is_empty() && c != "k" && c != "к" && c != "0"
                };
                
                if let Some(sal_fmt) = v.get("salaryFormat").or_else(|| v.get("salary_format")).and_then(|s| s.as_str()) {
                    if is_valid_salary(sal_fmt) { 
                        salary = format_salary_string(sal_fmt.trim()); 
                    }
                } 
                
                if salary.is_empty() {
                    if let Some(s_val) = v.get("salary") {
                        if let Some(s_str) = s_val.as_str() {
                            if is_valid_salary(s_str) { 
                                salary = format_salary_string(s_str.trim()); 
                            }
                        } else if let Some(s_obj) = s_val.as_object() {
                            let min = s_obj.get("min").or_else(|| s_obj.get("from")).and_then(|m| m.as_f64().or_else(|| m.as_i64().map(|i| i as f64))).unwrap_or(0.0);
                            let max = s_obj.get("max").or_else(|| s_obj.get("to")).and_then(|m| m.as_f64().or_else(|| m.as_i64().map(|i| i as f64))).unwrap_or(0.0);
                            let currency = s_obj.get("currency").and_then(|c| c.as_str()).unwrap_or("₽");
                            
                            let format_num = |n: f64| -> String {
                                let num_str = (n.trunc() as i64).to_string();
                                let mut res = String::new();
                                for (i, c) in num_str.chars().rev().enumerate() {
                                    if i > 0 && i % 3 == 0 { res.push(' '); }
                                    res.push(c);
                                }
                                res.chars().rev().collect()
                            };

                            if min > 0.0 && max > 0.0 { 
                                salary = format!("от {} до {} {}", format_num(min), format_num(max), currency); 
                            } else if min > 0.0 { 
                                salary = format!("{} {}", format_num(min), currency); 
                            } else if max > 0.0 { 
                                salary = format!("до {} {}", format_num(max), currency); 
                            }
                        }
                    }
                }

                results.push(Vacancy { title, link, company, salary });
            }
        }
    }

    Ok(results)
}