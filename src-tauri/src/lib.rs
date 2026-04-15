mod models;
mod scrapers;

use models::Vacancy;
use reqwest::Client;
use std::sync::Arc;
use tokio::sync::Mutex;
use std::fs;
use std::path::PathBuf;

lazy_static::lazy_static! {
    static ref HTTP_CLIENT: Arc<Mutex<Client>> = Arc::new(Mutex::new(Client::new()));
}

#[tauri::command]
async fn search_jobs(
    query: String,
    site: String,
    page: u32,
    location: String,
    work_format: String,
) -> Result<Vec<Vacancy>, String> {
    let client = HTTP_CLIENT.lock().await.clone();

    // Элегантный роутинг: отправляем запрос в нужный модуль
    match site.as_str() {
        "hh" => scrapers::hh::scrape(&client, &query, page, &location, &work_format).await,
        "zarplata" => scrapers::zarplata::scrape(&client, &query, page, &location, &work_format).await,
        "habr" => scrapers::habr::scrape(&client, &query, page, &location, &work_format).await,
        "superjob" => scrapers::superjob::scrape(&client, &query, page, &location, &work_format).await,
        "geekjob" => scrapers::geekjob::scrape(&client, &query, page, &location, &work_format).await,
        "trudvsem" => scrapers::trudvsem::scrape(&client, &query, page, &location, &work_format).await,
        "remotejob" => scrapers::remote_job::scrape(&client, &query, page, &location, &work_format).await,
        "rabotaru" => scrapers::rabota_ru::scrape(&client, &query, page, &location, &work_format).await, // <--- Наш финальный аккорд: Rabota.ru
        _ => Err(format!("Неизвестный источник: {}", site)),
    }
}

#[tauri::command]
fn open_browser(url: String) {
    let _ = webbrowser::open(&url);
}

fn get_favorites_path() -> PathBuf {
    let mut path = dirs::data_dir().unwrap_or_else(|| PathBuf::from("."));
    path.push("robotnichkoff_favorites.json");
    path
}

#[tauri::command]
fn save_favorites(items: Vec<Vacancy>) -> Result<(), String> {
    let path = get_favorites_path();
    let data = serde_json::to_string(&items).map_err(|e| e.to_string())?;
    fs::write(path, data).map_err(|e| e.to_string())
}

#[tauri::command]
fn load_favorites() -> Result<Vec<Vacancy>, String> {
    let path = get_favorites_path();
    if !path.exists() {
        return Ok(Vec::new());
    }
    let data = fs::read_to_string(path).map_err(|e| e.to_string())?;
    serde_json::from_str(&data).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_badge(_app_handle: tauri::AppHandle, _count: usize) {
    // Безопасная заглушка для бейджа
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            search_jobs,
            open_browser,
            save_favorites,
            load_favorites,
            update_badge
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}