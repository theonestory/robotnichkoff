use crate::models::Vacancy;
use reqwest::Client;
use scraper::{Html, Selector};

pub async fn scrape(
    client: &Client, query: &str, page: u32, _location: &str, work_format: &str,
) -> Result<Vec<Vacancy>, String> {
    let mut results = Vec::new();
    let ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

    let safe_query = query.replace(" ", "+");
    let mut url = format!("https://hh.ru/search/vacancy?text={}&page={}&items_on_page=20", safe_query, page);

    if !work_format.is_empty() { url.push_str(work_format); }

    let response = client.get(&url).header("User-Agent", ua).send().await.map_err(|e| e.to_string())?;
    let html_content = response.text().await.map_err(|e| e.to_string())?;
    let document = Html::parse_document(&html_content);

    let card_selector = Selector::parse("[data-qa='vacancy-serp__vacancy'], .vacancy-card--z_UXteNo7bRGzxWVcL7A, [data-qa='vacancy-serp__vacancy_premium'], [class*='magritte-card']").unwrap();
    let title_selector = Selector::parse("[data-qa='serp-item__title'], [data-qa='vacancy-title'], h2 a, h3 a, .bloko-link").unwrap();
    let company_selector = Selector::parse("[data-qa='vacancy-serp__vacancy-employer'], [data-qa='vacancy-employer']").unwrap();
    
    for element in document.select(&card_selector) {
        if let Some(t_el) = element.select(&title_selector).next() {
            let title = t_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
            if title.is_empty() { continue; }

            let raw_link = t_el.value().attr("href").unwrap_or("");
            let link = if raw_link.starts_with("http") { raw_link.to_string() } else { format!("https://hh.ru{}", raw_link) };

            let mut company = "Компания не указана".to_string();
            if let Some(c_el) = element.select(&company_selector).next() {
                company = c_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
            } else {
                let comp_fallback = Selector::parse(".company-info-text--rDzpeXy2iA9AQpWz_K7y").unwrap();
                if let Some(c_el) = element.select(&comp_fallback).next() {
                    company = c_el.text().collect::<Vec<_>>().join(" ").trim().to_string();
                }
            }
            company = company.replace('\u{a0}', " ").replace('\u{202f}', " ");
            while company.contains("  ") { company = company.replace("  ", " "); }

            // 🔥 ИДЕАЛЬНЫЙ ТОКЕНИЗАТОР ЗАРПЛАТЫ 🔥
            let full_text = element.text().collect::<Vec<_>>().join(" ");
            let mut normalized = full_text.replace('\u{a0}', " ").replace('\u{202f}', " ");
            
            // Превращаем любые виды тире в слово "до"
            normalized = normalized.replace("—", " до ").replace("–", " до ").replace("-", " до ");
            // Убираем скобки и запятые, чтобы они не прилипали к цифрам
            normalized = normalized.replace("(", " ").replace(")", " ").replace(",", " ");
            
            let currencies = ["₽", "₸", "$", "€", "руб", "сум", "byn", "br"];
            let words: Vec<&str> = normalized.split_whitespace().collect();
            
            let mut buffer = Vec::new();
            let mut salary = String::new();

            for w in words {
                let w_lower = w.to_lowercase();
                // Является ли слово только цифрами (или точкой)
                let is_number = w.chars().all(|c| c.is_digit(10) || c == '.');
                let is_keyword = w_lower == "от" || w_lower == "до";
                let is_currency = currencies.iter().any(|&c| w_lower.contains(c));
                
                // Если это нужная нам часть зарплаты - складываем в буфер
                if is_number || is_keyword || is_currency {
                    buffer.push(w.to_string());
                    // Если дошли до валюты - это конец зарплатной вилки, стоп!
                    if is_currency {
                        salary = buffer.join(" ");
                        break; 
                    }
                } else {
                    // Если встретили слово "Выплаты", "Опыт", "на руки" - очищаем буфер!
                    buffer.clear();
                }
            }
            
            // Финальная валидация и наведение красоты
            if !salary.is_empty() && salary.chars().any(|c| c.is_digit(10)) {
                let lower = salary.to_lowercase();
                // Если есть "до", но нет "от" в начале — подставляем (50 000 до 100 000 -> от 50 000 до 100 000)
                if lower.contains(" до ") && !lower.starts_with("от ") && !lower.starts_with("до ") {
                    salary = format!("от {}", salary);
                }
                salary = salary.replace("руб.", "₽").replace("руб", "₽");
            } else {
                salary = "".to_string(); // Нет цифр = красная плашка
            }

            results.push(Vacancy { title, link, company, salary });
        }
    }
    Ok(results)
}