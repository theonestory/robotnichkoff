use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
pub struct Vacancy {
    pub title: String,
    pub link: String,
    pub company: String,
    pub salary: String,
}