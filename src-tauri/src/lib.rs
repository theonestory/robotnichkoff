use reqwest::header::{ACCEPT_LANGUAGE, USER_AGENT};
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use std::fs;
use std::process::Command;

use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    AppHandle, Manager, WindowEvent,
};
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
async fn search_jobs(
    query: String,
    site: String,
    page: u32,
    location: String,
    work_format: String,
) -> Result<Vec<Vacancy>, String> {
    let client = reqwest::Client::new();
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    if site == "hh" || site == "zarplata" {
        let base_url = if site == "hh" { "https://hh.ru" } else { "https://www.zarplata.ru" };
        let area = if location.is_empty() { "113".to_string() } else { location };
        
        let url = format!("{}/search/vacancy?text={}&area={}{}&page={}", base_url, query, area, work_format, page);
        
        let response = client.get(&url).header(USER_AGENT, ua).header(ACCEPT_LANGUAGE, "ru-RU,ru;q=0.9").send().await.map_err(|e| e.to_string())?;
        let html_content = response.text().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&html_content);
        
        let vacancy_selector = Selector::parse("[data-qa='serp-item'], [data-qa='vacancy-serp__vacancy']").unwrap();
        let title_selector = Selector::parse("[data-qa*='title'], [data-qa='serp-item__title']").unwrap();
        let company_selector = Selector::parse("[data-qa='vacancy-serp__vacancy-employer'], [data-qa='vacancy-employer'], [data-qa='serp-item__meta-info-company'], [data-qa='vacancy-company-name'], .vacancy-serp-item__meta-info").unwrap();
        let salary_selector = Selector::parse("[data-qa='serp-item__compensation'], [data-qa='vacancy-serp__vacancy-compensation'], [data-qa='vacancy-salary-compensation-type-gross'], [data-qa='vacancy-salary-compensation-type-net'], [data-qa='vacancy-salary-compensation-type-undefined'], [data-qa='vacancy-salary'], [data-qa*='compensation']").unwrap();

        for element in document.select(&vacancy_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                let company = element.select(&company_selector).filter_map(|c| { let n = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" "); if n.is_empty() { None } else { Some(n) } }).next().unwrap_or_else(|| "Компания не указана".to_string());
                
                let mut salary = String::new();
                for s_node in element.select(&salary_selector) {
                    let txt = s_node.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                    let t = txt.to_lowercase();
                    if t.contains('₽') || t.contains("руб") || t.contains('$') || t.contains('€') { salary = txt; break; }
                }

                if salary.is_empty() {
                    let mut poss: Vec<String> = element.select(&Selector::parse("span, div").unwrap()).filter_map(|s| {
                        let n = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" ");
                        let t = n.to_lowercase();
                        if (t.contains('₽') || t.contains("руб") || t.contains('$') || t.contains('€')) && n.len() > 3 && n.len() < 150 && !t.contains("требования") && !t.contains("обязанности") { Some(n) } else { None }
                    }).collect();
                    if !poss.is_empty() { poss.sort_by_key(|a| a.len()); salary = poss.into_iter().next().unwrap(); } 
                    else { salary = "ЗП: не указана".to_string(); }
                }

                let mut final_salary = salary.clone();
                if let Some(idx) = salary.find("Опыт") { final_salary = salary[..idx].trim().to_string(); }
                
                let mut link = t_el.value().attr("href").unwrap_or("").to_string();
                if !link.starts_with("http") && !link.is_empty() { link = format!("{}{}", base_url, link); }

                results.push(Vacancy { title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(), link, company, salary: if final_salary.trim().is_empty() { "ЗП: не указана".to_string() } else { final_salary } });
            }
        }
    } 
    else if site == "habr" {
        let loc_param = if location.is_empty() { "".to_string() } else { format!("&locations[]={}", location) };
        let url = format!("https://career.habr.com/vacancies?q={}&type=all{}{}&page={}", query, loc_param, work_format, page + 1);
        
        let response = client.get(&url).header(USER_AGENT, ua).send().await.map_err(|e| e.to_string())?;
        let document = Html::parse_document(&response.text().await.map_err(|e| e.to_string())?);
        let card_selector = Selector::parse(".vacancy-card").unwrap();
        let title_selector = Selector::parse(".vacancy-card__title-link").unwrap();
        let company_selector = Selector::parse(".vacancy-card__company-title > a, .link-comp").unwrap();
        let salary_selector = Selector::parse(".vacancy-card__salary").unwrap();

        for element in document.select(&card_selector) {
            if let Some(t_el) = element.select(&title_selector).next() {
                let raw_link = t_el.value().attr("href").unwrap_or("");
                let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://career.habr.com{}", raw_link) };
                let company = element.select(&company_selector).filter_map(|c| { let n = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" "); if n.is_empty() { None } else { Some(n) } }).next().unwrap_or_else(|| "Компания не указана".to_string());
                let salary = element.select(&salary_selector).filter_map(|s| { let n = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" "); if n.is_empty() { None } else { Some(n) } }).next().unwrap_or_else(|| "ЗП: не указана".to_string());
                results.push(Vacancy { title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(), link, company, salary });
            }
        }
    }
    else if site == "superjob" {
        let loc_param = if location.is_empty() { "".to_string() } else { format!("&town={}", location) };
        let url = format!("https://www.superjob.ru/vacancy/search/?keywords={}{}{}&page={}", query, loc_param, work_format, page + 1);
        
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
                let company = element.select(&company_selector).filter_map(|c| { let n = c.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" "); if n.is_empty() { None } else { Some(n) } }).next().unwrap_or_else(|| "Компания не указана".to_string());
                let salary = element.select(&salary_selector).filter_map(|s| { let n = s.text().collect::<Vec<_>>().join(" ").split_whitespace().collect::<Vec<_>>().join(" "); if n.is_empty() { None } else { Some(n) } }).next().unwrap_or_else(|| "ЗП: не указана".to_string());
                results.push(Vacancy { title: t_el.text().collect::<Vec<_>>().join(" ").trim().to_string(), link, company, salary });
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

#[tauri::command]
#[allow(unused_variables)] // Подавляем варнинги компилятора на Windows
fn update_badge(_count: i64, _app: tauri::AppHandle) {
    #[cfg(any(target_os = "macos", target_os = "linux"))]
    if let Some(window) = _app.get_webview_window("main") {
        let _ = window.set_badge_count(if _count > 0 { Some(_count) } else { None });
    }
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
        .invoke_handler(tauri::generate_handler![search_jobs, save_favorites, load_favorites, open_browser, update_badge]) 
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(|app_handle, event| match event {
            // МАКРОС ТЕПЕРЬ СТОИТ ЗДЕСЬ. 
            // На Windows этот блок вообще не будет компилироваться, 
            // а на macOS он отработает идеально.
            #[cfg(target_os = "macos")]
            tauri::RunEvent::Reopen { .. } => {
                if let Some(window) = app_handle.get_webview_window("main") {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }
            _ => {}
        });
}