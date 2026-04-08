use reqwest::header::{USER_AGENT, ACCEPT_LANGUAGE};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

// Добавлен AppHandle для строгой типизации
use tauri::{menu::{Menu, MenuItem}, tray::TrayIconBuilder, AppHandle, Manager, WindowEvent};
use tauri_plugin_notification::NotificationExt;

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
        let url = format!("{}/search/vacancy?text={}&area=113&page={}", base_url, query, page);
        
        let response = client.get(&url).header(USER_AGENT, ua).header(ACCEPT_LANGUAGE, "ru-RU,ru;q=0.9").send().await.map_err(|e| e.to_string())?;
        let html_content = response.text().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&html_content);
        
        let vacancy_selector = Selector::parse("[data-qa='serp-item'], [data-qa='vacancy-serp__vacancy']").unwrap();
        let title_selector = Selector::parse("[data-qa*='title'], [data-qa='serp-item__title']").unwrap();
        
        let company_selector = Selector::parse("\
            [data-qa='vacancy-serp__vacancy-employer'], \
            [data-qa='vacancy-employer'], \
            [data-qa='serp-item__meta-info-company'], \
            [data-qa='vacancy-company-name'], \
            .vacancy-serp-item__meta-info\
        ").unwrap();
        
        let salary_selector = Selector::parse("\
            [data-qa='serp-item__compensation'], \
            [data-qa='vacancy-serp__vacancy-compensation'], \
            [data-qa='vacancy-salary-compensation-type-gross'], \
            [data-qa='vacancy-salary-compensation-type-net'], \
            [data-qa='vacancy-salary-compensation-type-undefined'], \
            [data-qa='vacancy-salary'], \
            [data-qa*='compensation']\
        ").unwrap();

        for element in document.select(&vacancy_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                
                let company = element.select(&company_selector)
                    .filter_map(|c| {
                        let norm = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ");
                        if norm.is_empty() { None } else { Some(norm) }
                    })
                    .next()
                    .unwrap_or_else(|| "Компания не указана".to_string());

                // ФЕЙС-КОНТРОЛЬ НА ВАЛЮТУ: Ищем ЗП, но берем только если там есть деньги
                let mut salary = String::new();
                for s_node in element.select(&salary_selector) {
                    let txt = s_node.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ");
                    let t = txt.to_lowercase();
                    // Отсекаем мусор типа "Выплаты: два раза в месяц"
                    if t.contains('₽') || t.contains("руб") || t.contains('$') || t.contains('€') {
                        salary = txt;
                        break;
                    }
                }

                // УМНЫЙ ФОЛБЭК: Если стандартные теги подвели, ищем цифры по всей карточке
                if salary.is_empty() {
                    let mut possible_salaries: Vec<String> = element.select(&Selector::parse("span, div").unwrap())
                        .filter_map(|s| {
                            let norm = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ");
                            let t = norm.to_lowercase();
                            if (t.contains('₽') || t.contains("руб") || t.contains('$') || t.contains('€')) && norm.len() > 3 && norm.len() < 150 {
                                // Исключаем куски огромного текста
                                if !t.contains("требования") && !t.contains("обязанности") {
                                    Some(norm)
                                } else {
                                    None
                                }
                            } else {
                                None
                            }
                        })
                        .collect();
                    
                    if !possible_salaries.is_empty() {
                        possible_salaries.sort_by_key(|a| a.len());
                        salary = possible_salaries.into_iter().next().unwrap();
                    } else {
                        salary = "ЗП: не указана".to_string();
                    }
                }

                if let Some(idx) = salary.find("Опыт") { salary = salary[..idx].trim().to_string(); }
                let final_salary = if salary.trim().is_empty() { "ЗП: не указана".to_string() } else { salary };
                
                let mut link = t_el.value().attr("href").unwrap_or("").to_string();
                if !link.starts_with("http") && !link.is_empty() { link = format!("{}{}", base_url, link); }

                results.push(Vacancy {
                    title: t_el.text().collect::<Vec<_>>().join(" ").replace("\u{a0}", " ").trim().to_string(),
                    link, 
                    company, 
                    salary: final_salary,
                });
            }
        }
    } 
    else if site == "habr" {
        let url = format!("https://career.habr.com/vacancies?q={}&type=all&page={}", query, page + 1);
        let response = client.get(&url).header(USER_AGENT, ua).send().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&response.text().await.map_err(|e| e.to_string())?);
        
        let card_selector = Selector::parse(".vacancy-card").unwrap();
        let title_selector = Selector::parse(".vacancy-card__title-link").unwrap();
        let company_selector = Selector::parse(".vacancy-card__company-title, .vacancy-card__company, .link-comp, .company_name").unwrap();
        let salary_selector = Selector::parse(".vacancy-card__salary").unwrap();

        for element in document.select(&card_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                let raw_link = t_el.value().attr("href").unwrap_or("");
                let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://career.habr.com{}", raw_link) };
                
                let company = element.select(&company_selector)
                    .filter_map(|c| {
                        let norm = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                        if norm.is_empty() { None } else { Some(norm) }
                    })
                    .next()
                    .unwrap_or_else(|| "Компания не указана".to_string());

                let salary = element.select(&salary_selector)
                    .filter_map(|s| {
                        let norm = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                        if norm.is_empty() { None } else { Some(norm) }
                    })
                    .next()
                    .unwrap_or_else(|| "ЗП: не указана".to_string());

                results.push(Vacancy {
                    title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(),
                    link, company, salary,
                });
            }
        }
    }
    else if site == "superjob" {
        let url = format!("https://www.superjob.ru/vacancy/search/?keywords={}&page={}", query, page + 1);
        let response = client.get(&url).header(USER_AGENT, ua).send().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&response.text().await.map_err(|e| e.to_string())?);
        
        let card_selector = Selector::parse("div[class*='f-test-vacancy-item']").unwrap();
        let title_selector = Selector::parse("a[class*='f-test-link'][href*='/vakansii/']").unwrap();
        let company_selector = Selector::parse("span[class*='f-test-text-vacancy-item-company']").unwrap();
        let salary_selector = Selector::parse("span[class*='f-test-text-company-item-salary']").unwrap();

        for element in document.select(&card_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                let raw_link = t_el.value().attr("href").unwrap_or("");
                let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://www.superjob.ru{}", raw_link) };
                
                let company = element.select(&company_selector)
                    .filter_map(|c| {
                        let norm = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                        if norm.is_empty() { None } else { Some(norm) }
                    })
                    .next()
                    .unwrap_or_else(|| "Компания не указана".to_string());

                let salary = element.select(&salary_selector)
                    .filter_map(|s| {
                        let norm = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                        if norm.is_empty() { None } else { Some(norm) }
                    })
                    .next()
                    .unwrap_or_else(|| "ЗП: не указана".to_string());

                results.push(Vacancy { 
                    title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(), 
                    link, company, salary,
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
        .plugin(tauri_plugin_notification::init()) 
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Выйти из Роботничкоффа", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Развернуть радар", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let _tray = TrayIconBuilder::new()
                .menu(&menu)
                .show_menu_on_left_click(true)
                .icon(app.default_window_icon().unwrap().clone())
                .on_menu_event(|app: &AppHandle, event| match event.id.as_ref() {
                    "quit" => {
                        std::process::exit(0); 
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            window.show().unwrap();
                            window.set_focus().unwrap();
                        }
                    }
                    _ => {}
                })
                .build(app)?;

            Ok(())
        })
        .on_window_event(|window, event| match event {
            WindowEvent::CloseRequested { api, .. } => {
                api.prevent_close(); 
                window.hide().unwrap(); 
                
                let _ = window.app_handle().notification()
                    .builder()
                    .title("Радар активен 🦾")
                    .body("Роботничкофф свернут в трей и продолжает искать новые вакансии.")
                    .show();
            }
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![search_jobs, save_favorites, load_favorites, open_browser]) 
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}