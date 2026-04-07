use reqwest::header::{USER_AGENT, ACCEPT_LANGUAGE};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

#[derive(Serialize, Deserialize, Clone)]
pub struct Vacancy {
    pub title: String,
    pub link: String,
    pub company: String,
    pub salary: String,
}

#[tauri::command]
fn open_browser(url: String) {
    #[cfg(target_os = "windows")]
    {
        let _ = Command::new("cmd")
            .args(&["/C", "start", "", &url])
            .creation_flags(0x08000000)
            .spawn();
    }
    #[cfg(target_os = "macos")]
    {
        let _ = Command::new("open").arg(&url).spawn();
    }
    #[cfg(target_os = "linux")]
    {
        let _ = Command::new("xdg-open").arg(&url).spawn();
    }
}

#[tauri::command]
async fn search_jobs(query: String, site: String, page: u32) -> Result<Vec<Vacancy>, String> {
    let client = reqwest::Client::new();
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    if site == "hh" || site == "zarplata" {
        let base_url = if site == "hh" { "https://hh.ru" } else { "https://www.zarplata.ru" };
        // Добавлен параметр &page
        let url = format!("{}/search/vacancy?text={}&area=113&page={}", base_url, query, page);
        
        let response = client.get(&url).header(USER_AGENT, ua).header(ACCEPT_LANGUAGE, "ru-RU,ru;q=0.9").send().await.map_err(|e| e.to_string())?;
        let html_content = response.text().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&html_content);
        
        let vacancy_selector = Selector::parse("[data-qa='serp-item'], [data-qa='vacancy-serp__vacancy']").unwrap();
        let title_selector = Selector::parse("[data-qa*='title'], [data-qa='serp-item__title']").unwrap();
        let company_selector = Selector::parse("[data-qa='vacancy-serp__vacancy-employer'], [data-qa='vacancy-employer'], [data-qa='serp-item__meta-info-company'], .vacancy-serp-item__meta-info").unwrap();
        let salary_selector = Selector::parse("[data-qa='serp-item__compensation'], [data-qa='vacancy-serp__vacancy-compensation']").unwrap();
        let fallback_selector = Selector::parse("span, div").unwrap();

        for element in document.select(&vacancy_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                let company = element.select(&company_selector)
                    .next()
                    .map(|c| c.text().collect::<Vec<_>>().join(" "))
                    .unwrap_or_default()
                    .replace("\u{a0}", " ").trim().to_string();

                let mut salary = element.select(&salary_selector)
                    .next()
                    .map(|s| s.text().collect::<Vec<_>>().join(" "))
                    .unwrap_or_else(|| {
                        element.select(&fallback_selector)
                            .map(|s| s.text().collect::<Vec<_>>().join(" "))
                            .find(|txt| {
                                let t = txt.to_lowercase();
                                (t.contains('₽') || t.contains("руб")) && (t.contains("от") || t.contains("до")) && txt.len() < 60
                            })
                            .unwrap_or_else(|| "З/П не указана".to_string())
                    }).replace("\u{a0}", " ");

                if let Some(idx) = salary.find("Опыт") { salary = salary[..idx].to_string(); }
                
                let mut link = t_el.value().attr("href").unwrap_or("").to_string();
                if !link.starts_with("http") && !link.is_empty() { link = format!("{}{}", base_url, link); }

                results.push(Vacancy {
                    title: t_el.text().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ").trim().to_string(),
                    link, company, salary: salary.trim().to_string(),
                });
            }
        }
    } 
    else if site == "habr" {
        // У Хабра пагинация начинается с 1
        let url = format!("https://career.habr.com/vacancies?q={}&type=all&page={}", query, page + 1);
        let response = client.get(&url).header(USER_AGENT, ua).send().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&response.text().await.map_err(|e| e.to_string())?);
        for element in document.select(&Selector::parse(".vacancy-card").unwrap()) {
            if let Some(t_el) = element.select(&Selector::parse(".vacancy-card__title-link").unwrap()).next() {
                let raw_link = t_el.value().attr("href").unwrap_or("");
                let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://career.habr.com{}", raw_link) };
                results.push(Vacancy {
                    title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(),
                    link,
                    company: element.select(&Selector::parse(".vacancy-card__company-title").unwrap()).next().map(|c| c.text().collect::<Vec<_>>().join(" ")).unwrap_or_default().trim().to_string(),
                    salary: element.select(&Selector::parse(".vacancy-card__salary").unwrap()).next().map(|s| s.text().collect::<Vec<_>>().join(" ")).unwrap_or_else(|| "З/П не указана".to_string()),
                });
            }
        }
    }
    else if site == "superjob" {
        // У SuperJob пагинация начинается с 1
        let url = format!("https://www.superjob.ru/vacancy/search/?keywords={}&page={}", query, page + 1);
        let response = client.get(&url).header(USER_AGENT, ua).send().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&response.text().await.map_err(|e| e.to_string())?);
        for element in document.select(&Selector::parse("div[class*='f-test-vacancy-item']").unwrap()) {
            if let Some(t_el) = element.select(&Selector::parse("a[class*='f-test-link'][href*='/vakansii/']").unwrap()).next() {
                let raw_link = t_el.value().attr("href").unwrap_or("");
                let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://www.superjob.ru{}", raw_link) };
                results.push(Vacancy { 
                    title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(), 
                    link, 
                    company: element.select(&Selector::parse("span[class*='f-test-text-vacancy-item-company']").unwrap()).next().map(|c| c.text().collect::<Vec<_>>().join(" ")).unwrap_or_else(|| "Компания".to_string()).trim().to_string(),
                    salary: element.select(&Selector::parse("span[class*='f-test-text-company-item-salary']").unwrap()).next().map(|s| s.text().collect::<Vec<_>>().join(" ")).unwrap_or_else(|| "По договоренности".to_string()),
                });
            }
        }
    }
    Ok(results)
}

#[tauri::command]
fn save_favorites(items: Vec<Vacancy>) -> Result<(), String> {
    let json = serde_json::to_string_pretty(&items).map_err(|e| e.to_string())?;
    fs::write(".favorites.json", json).map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn load_favorites() -> Result<Vec<Vacancy>, String> {
    if let Ok(data) = fs::read_to_string(".favorites.json") {
        let items: Vec<Vacancy> = serde_json::from_str(&data).map_err(|e| e.to_string())?;
        return Ok(items);
    }
    Ok(Vec::new())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![search_jobs, save_favorites, load_favorites, open_browser]) 
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}