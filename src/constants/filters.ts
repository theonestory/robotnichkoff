export const LANG_FILTERS = [
  { id: "ru", name: "Русский язык (Всё приложение)" },
  { id: "en", name: "English (vacancies in Russian)" }
];

export const getSalaryFilters = (lang: "ru" | "en") => [
  { id: "all", name: lang === "ru" ? "Все вакансии" : "All vacancies" },
  { id: "with_salary", name: lang === "ru" ? "Только с указанием ЗП" : "Only with salary" },
  { id: "without_salary", name: lang === "ru" ? "Только без указания ЗП" : "Only without salary" }
];