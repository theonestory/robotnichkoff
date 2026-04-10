import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { AptabaseProvider, useAptabase } from "@aptabase/react";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import "./App.css";

import { isJobMatch } from "./filters/filterEngine";
import { COUNTRIES, CITIES, WORK_FORMATS } from "./filters/locations";

import hhLogo from "./assets/logos/hh.svg";
import habrLogo from "./assets/logos/habr.svg";
import sjLogo from "./assets/logos/superjob.svg";
import zarplataLogo from "./assets/logos/zarplata.svg";
import notiSound from "./assets/noti-robo.wav";

interface Vacancy {
  title: string; link: string; company: string; salary: string;
}

const DICT = {
  ru: {
    app_name: "Robotничкофф",
    nav_search: "🔍 Поиск",
    nav_favs: "❤️ Избранное",
    nav_history: "🕒 Вы смотрели",
    theme_light: "☀️ Светлая",
    theme_dark: "🌙 Темная",
    contact_author: "Связаться с автором",
    loading_search: "Опрашиваем площадки...",
    loading_bg: "Фоновая подгрузка...",
    update_available: "🚀 Доступна версия",
    update_btn: "ОБНОВИТЬ",
    search_placeholder: "Название вакансии или должности",
    new_vacancies: "Новые вакансии",
    empty_favs: "Нет избранных",
    empty_history: "История пуста",
    empty_search: "Ничего не найдено",
    no_title: "Без названия",
    no_company: "Компания не указана",
    salary_missing: "ЗП: не указано",
    salary_prefix: "ЗП: ",
    show_more: "Показать еще",
    settings_title: "Параметры поиска",
    filter_country: "Страна",
    filter_city: "Город или Регион",
    filter_format: "Формат работы",
    filter_salary: "Вакансии и ЗП",
    filter_lang: "Язык интерфейса",
    btn_apply: "Применить фильтры",
    btn_applied: "Применено",
    version: "Версия",
    push_title: "Срочно проверяй! 🚀",
    push_body: "Найдено {count} новых вакансий.",
    select_placeholder: "Выберите..."
  },
  en: {
    app_name: "Robotnichkoff",
    nav_search: "🔍 Search",
    nav_favs: "❤️ Favorites",
    nav_history: "🕒 History",
    theme_light: "☀️ Light",
    theme_dark: "🌙 Dark",
    contact_author: "Contact Author",
    loading_search: "Querying platforms...",
    loading_bg: "Background loading...",
    update_available: "🚀 Update available",
    update_btn: "UPDATE",
    search_placeholder: "Job title or keyword",
    new_vacancies: "New vacancies",
    empty_favs: "No favorites yet",
    empty_history: "History is empty",
    empty_search: "Nothing found",
    no_title: "No title",
    no_company: "Company not specified",
    salary_missing: "Salary: not specified",
    salary_prefix: "Salary: ",
    show_more: "Show more",
    settings_title: "Search Parameters",
    filter_country: "Country",
    filter_city: "City or Region",
    filter_format: "Work Format",
    filter_salary: "Vacancies & Salary",
    filter_lang: "Interface Language",
    btn_apply: "Apply Filters",
    btn_applied: "Applied",
    version: "Version",
    push_title: "Check it out! 🚀",
    push_body: "Found {count} new vacancies.",
    select_placeholder: "Select..."
  }
};

const LOCATIONS_EN: Record<string, string> = {
  "Везде": "Anywhere", "Россия и СНГ": "Russia & CIS", "СНГ": "CIS", "Европа": "Europe", "США": "USA",
  "Россия": "Russia", "Беларусь": "Belarus", "Казахстан": "Kazakhstan", "Армения": "Armenia", 
  "Грузия": "Georgia", "Азербайджан": "Azerbaijan", "Кыргызстан": "Kyrgyzstan", "Молдова": "Moldova",
  "Таджикистан": "Tajikistan", "Туркменистан": "Turkmenistan", "Узбекистан": "Uzbekistan",
  "Германия": "Germany", "Великобритания": "UK", "Польша": "Poland", "Кипр": "Cyprus", 
  "Сербия": "Serbia", "Нидерланды": "Netherlands", "Франция": "France", "Испания": "Spain", "Италия": "Italy",
  "Все локации": "All locations", "Вся Россия и СНГ": "All Russia & CIS", "Все страны СНГ (без РФ)": "All CIS (except RU)",
  "Все страны Европы": "All Europe", "Все США": "All USA", "Вся Россия": "All Russia", "Вся Беларусь": "All Belarus",
  "Весь Казахстан": "All Kazakhstan", "Вся Армения": "All Armenia", "Вся Грузия": "All Georgia",
  "Весь Азербайджан": "All Azerbaijan", "Весь Кыргызстан": "All Kyrgyzstan", "Вся Молдова": "All Moldova",
  "Весь Таджикистан": "All Tajikistan", "Весь Туркменистан": "All Turkmenistan", "Весь Узбекистан": "All Uzbekistan",
  "Вся Германия": "All Germany", "Вся Великобритания": "All UK", "Вся Польша": "All Poland", "Весь Кипр": "All Cyprus",
  "Вся Сербия": "All Serbia", "Все Нидерланды": "All Netherlands", "Вся Франция": "All France", "Вся Испания": "All Spain",
  "Москва": "Moscow", "Санкт-Петербург": "St. Petersburg", "Новосибирск": "Novosibirsk", "Екатеринбург": "Yekaterinburg",
  "Казань": "Kazan", "Нижний Новгород": "Nizhny Novgorod", "Челябинск": "Chelyabinsk", "Самара": "Samara",
  "Уфа": "Ufa", "Ростов-на-Дону": "Rostov-on-Don", "Краснодар": "Krasnodar", "Минск": "Minsk",
  "Гомель": "Gomel", "Витебск": "Vitebsk", "Могилев": "Mogilev", "Гродно": "Grodno", "Брест": "Brest",
  "Алматы": "Almaty", "Астана": "Astana", "Шымкент": "Shymkent", "Караганда": "Karaganda",
  "Ереван": "Yerevan", "Гюмри": "Gyumri", "Тбилиси": "Tbilisi", "Батуми": "Batumi", "Баку": "Baku",
  "Бишкек": "Bishkek", "Кишинев": "Chisinau", "Душанбе": "Dushanbe", "Ашхабад": "Ashgabat", "Ташкент": "Tashkent",
  "Берлин": "Berlin", "Мюнхен": "Munich", "Франкфурт": "Frankfurt", "Лондон": "London", "Манчестер": "Manchester",
  "Варшава": "Warsaw", "Краков": "Krakow", "Лимассол": "Limassol", "Никосия": "Nicosia", "Белград": "Belgrade",
  "Нови-Сад": "Novi Sad", "Амстердам": "Amsterdam", "Роттердам": "Rotterdam", "Париж": "Paris",
  "Марсель": "Marseille", "Мадрид": "Madrid", "Барселона": "Barcelona", "Нью-Йорк": "New York",
  "Сан-Франциско": "San Francisco", "Лос-Анджелес": "Los Angeles", "Сиэтл": "Seattle", "Чикаго": "Chicago"
};

const FILTER_SITES = [
  { id: "all", label: "ВСЕ" }, { id: "hh", label: "HH.RU" }, { id: "habr", label: "HABR" }, { id: "superjob", label: "SUPERJOB" }, { id: "zarplata", label: "ZARPLATA" }
];

const LANG_FILTERS = [
  { id: "ru", name: "Русский язык (Всё приложение)" },
  { id: "en", name: "English (vacancies in Russian)" }
];

const getSalaryFilters = (lang: "ru" | "en") => [
  { id: "all", name: lang === "ru" ? "Все вакансии" : "All vacancies" },
  { id: "with_salary", name: lang === "ru" ? "Только с указанием ЗП" : "Only with salary" },
  { id: "without_salary", name: lang === "ru" ? "Только без указания ЗП" : "Only without salary" }
];

const shuffleResults = (array: Vacancy[]) => {
  if (!Array.isArray(array)) return [];
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

const getBaseLink = (url: string) => {
  if (!url) return "";
  let base = url.split('?')[0].split('#')[0].toLowerCase().trim();
  base = base.replace(/^https?:\/\//, '').replace(/^(www\.|m\.)/, '');
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base;
};

const cleanStr = (s: string) => (s || "").toLowerCase().trim();

const isDuplicate = (a: Vacancy, b: Vacancy) => {
   if (!a || !b) return false;
   if (getBaseLink(a.link) === getBaseLink(b.link) && a.link !== "") return true;
   return cleanStr(a.title) === cleanStr(b.title) && cleanStr(a.company) === cleanStr(b.company);
};

const ServiceLogo = ({ link }: { link: string }) => {
  const url = (link || "").toLowerCase();
  let src = "";
  if (url.includes("hh.ru")) src = hhLogo;
  else if (url.includes("habr.com")) src = habrLogo;
  else if (url.includes("superjob.ru")) src = sjLogo;
  else if (url.includes("zarplata.ru")) src = zarplataLogo;

  if (src) return <img src={src} alt="Logo" className="service-logo-img" />;
  return (
    <div className="service-logo-fallback">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>
    </div>
  );
};

const CustomSelect = ({ label, options, selectedId, onSelect, placeholder }: { label: string, options: any[], selectedId: string, onSelect: (id: string) => void, placeholder: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedName = options.find(o => o.id === selectedId)?.name || placeholder;

  return (
    <div className="w-full relative">
      <label className="block text-[10px] font-black uppercase tracking-[0.15em] mb-2" style={{ color: 'var(--text-dim)' }}>{label}</label>
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 rounded-2xl border-2 cursor-pointer flex justify-between items-center transition-all hover:shadow-md"
        style={{ borderColor: isOpen ? 'var(--text-main)' : 'var(--border)', backgroundColor: 'var(--bg-side)' }}
      >
        <span className="font-normal text-sm" style={{ color: 'var(--text-main)' }}>{selectedName}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--text-main)', transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}><path d="m6 9 6 6 6-6"/></svg>
      </div>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-[calc(100%+8px)] left-0 w-full rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col animate-in fade-in slide-in-from-top-2" style={{ backgroundColor: 'var(--bg-side)', border: '1px solid var(--border)', maxHeight: '250px' }}>
            <div className="overflow-y-auto custom-scrollbar flex-1 py-2">
              {options.map(opt => (
                <div
                  key={opt.id}
                  onClick={() => { onSelect(opt.id); setIsOpen(false); }}
                  className="px-5 py-3 text-sm font-normal cursor-pointer transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                  style={{ color: selectedId === opt.id ? '#10B981' : 'var(--text-main)' }}
                >
                  {opt.name}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

const fixLayoutTypo = (text: string): string => {
  if (!text) return text;
  
  const EN_TO_RU: Record<string, string> = {
    'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ',
    'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э',
    'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю', '`':'ё'
  };
  const RU_TO_EN: Record<string, string> = {};
  for (const [en, ru] of Object.entries(EN_TO_RU)) { RU_TO_EN[ru] = en; }

  const isPureEn = /^[a-zA-Z0-9\`\[\]\\;',.\s\-]+$/.test(text);
  const isPureRu = /^[а-яА-ЯёЁ0-9\s\-]+$/.test(text);

  if (isPureEn) {
    let ruTranslated = "";
    for(let i=0; i<text.length; i++) {
      const char = text[i];
      const lower = char.toLowerCase();
      const translated = EN_TO_RU[lower] || char;
      ruTranslated += char === lower ? translated : translated.toUpperCase();
    }
    const ruRoots = ['менедж', 'разработ', 'аналит', 'програм', 'дизайн', 'тестиров', 'инжен', 'администр', 'руковод', 'директ', 'специал', 'бухгалтер', 'оператор', 'ассистент', 'продукт', 'проект', 'систем', 'маркет', 'продаж', 'кадр', 'юрист', 'врач', 'учител', 'курьер', 'водител', 'стажер', 'данн', 'баз', 'сеть', 'сетев', 'безопасн', 'партн'];
    
    if (ruRoots.some(root => ruTranslated.toLowerCase().includes(root)) || /[a-zA-Z][;\[\]',][a-zA-Z]/.test(text)) {
      return ruTranslated;
    }
  }

  if (isPureRu) {
    let enTranslated = "";
    for(let i=0; i<text.length; i++) {
      const char = text[i];
      const lower = char.toLowerCase();
      const translated = RU_TO_EN[lower] || char;
      enTranslated += char === lower ? translated : translated.toUpperCase();
    }
    const enRoots = ['front', 'back', 'full', 'java', 'python', 'react', 'node', 'andr', 'ios', 'data', 'manag', 'design', 'test', 'admin', 'lead', 'head', 'chief', 'sale', 'mark', 'dev', 'ops', 'sec', 'game', 'web', 'app', 'soft', 'net', 'sql', 'php', 'ruby', 'golang', 'rust', 'c++'];
    
    if (enRoots.some(root => enTranslated.toLowerCase().includes(root))) {
      return enTranslated;
    }
  }

  return text;
};

function ApplicationContent() {
  const [activeLang, setActiveLang] = useState<"ru" | "en">((localStorage.getItem("jobSonar_lang") as "ru" | "en") || "ru");
  const t = DICT[activeLang];

  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [visitedVacancies, setVisitedVacancies] = useState<Vacancy[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
  const [filterSite, setFilterSite] = useState("all");
  const [view, setView] = useState<"search" | "favorites" | "history">("search");
  
  const [appVersion, setAppVersion] = useState("1.0.19");
  const [updateInfo, setUpdateInfo] = useState<{show: boolean, version: string, notified: boolean}>({ show: false, version: "", notified: false });

  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [pendingVacancies, setPendingVacancies] = useState<Vacancy[]>([]); 
  
  const [displayCount, setDisplayCount] = useState(20);
  const [nextFetchPage, setNextFetchPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBackground, setIsFetchingBackground] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [activeCountry, setActiveCountry] = useState(localStorage.getItem("jobSonar_country") || "all");
  const [activeCity, setActiveCity] = useState(localStorage.getItem("jobSonar_city") || "all_any");
  const [activeFormat, setActiveFormat] = useState(localStorage.getItem("jobSonar_format") || "any");
  const [activeSalary, setActiveSalary] = useState(localStorage.getItem("jobSonar_salary") || "all");

  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isSavingFilters, setIsSavingFilters] = useState(false);
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  const [draftCountry, setDraftCountry] = useState(activeCountry);
  const [draftCity, setDraftCity] = useState(activeCity);
  const [draftFormat, setDraftFormat] = useState(activeFormat);
  const [draftSalary, setDraftSalary] = useState(activeSalary);
  const [draftLang, setDraftLang] = useState(activeLang);

  const scrollRef = useRef<HTMLElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const allVacanciesRef = useRef(allVacancies);
  const pendingVacanciesRef = useRef(pendingVacancies);
  const { trackEvent } = useAptabase();

  const filterRefs = useRef({ city: activeCity, format: activeFormat, country: activeCountry });
  
  const localizedCountries = useMemo(() => COUNTRIES.map(c => ({
    ...c,
    name: activeLang === 'en' ? (LOCATIONS_EN[c.name] || c.name) : c.name
  })), [activeLang]);

  const localizedCities = useMemo(() => {
    const cityList = CITIES[draftCountry] || CITIES["all"];
    return cityList.map(c => ({
      ...c,
      name: activeLang === 'en' ? (LOCATIONS_EN[c.name] || c.name) : c.name
    }));
  }, [draftCountry, activeLang]);

  const localizedWorkFormats = useMemo(() => WORK_FORMATS.map(f => {
    if (f.id === 'any') return { ...f, name: activeLang === 'ru' ? 'Любой формат' : 'Any format' };
    if (f.id === 'remote') return { ...f, name: activeLang === 'ru' ? 'Удаленная работа' : 'Remote' };
    if (f.id === 'office') return { ...f, name: activeLang === 'ru' ? 'Офис / Гибрид' : 'Office / Hybrid' };
    return f;
  }), [activeLang]);

  useEffect(() => { allVacanciesRef.current = allVacancies; }, [allVacancies]);
  useEffect(() => { pendingVacanciesRef.current = pendingVacancies; }, [pendingVacancies]);
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = 0; }, [filterSite, view]);

  useEffect(() => {
    filterRefs.current = { city: activeCity, format: activeFormat, country: activeCountry };
    localStorage.setItem("jobSonar_country", activeCountry);
    localStorage.setItem("jobSonar_city", activeCity);
    localStorage.setItem("jobSonar_format", activeFormat);
    localStorage.setItem("jobSonar_salary", activeSalary);
    localStorage.setItem("jobSonar_lang", activeLang);
    document.documentElement.lang = activeLang;
  }, [activeCountry, activeCity, activeFormat, activeSalary, activeLang]);

  useEffect(() => {
    invoke("update_badge", { count: pendingVacancies.length }).catch(() => {});
  }, [pendingVacancies.length]);

  const getSearchParams = (site: string) => {
    const { country, city, format } = filterRefs.current;
    const cityList = CITIES[country] || CITIES["all"];
    const cityObj = cityList.find(c => c.id === city) || cityList[0];
    const formatObj = WORK_FORMATS.find(f => f.id === format) || WORK_FORMATS[0];

    let loc = cityObj.hh;
    if (site === "habr") loc = cityObj.habr;
    if (site === "superjob") loc = cityObj.sj;

    let fmt = formatObj.hh;
    if (site === "habr") fmt = formatObj.habr;
    if (site === "superjob") fmt = formatObj.sj;

    return { loc, fmt };
  };

  useEffect(() => {
    const initApp = async () => {
      let permission = await isPermissionGranted();
      if (!permission) permission = await requestPermission() === 'granted';

      trackEvent("app_opened", { version: appVersion });

      invoke<Vacancy[]>("load_favorites").then(res => { if (Array.isArray(res)) setFavorites(res); }).catch(() => setFavorites([]));
      const savedVisited = localStorage.getItem("jobSonar_visited");
      if (savedVisited) {
        try {
          const parsed = JSON.parse(savedVisited);
          if (Array.isArray(parsed)) {
            const cleaned = parsed.map(item => typeof item === 'string' ? { title: "viewed", link: item, company: "", salary: "" } : item)
              .filter(v => v.link && !v.link.toLowerCase().includes("github.com") && !v.link.toLowerCase().includes("linkedin.com"));
            setVisitedVacancies(cleaned);
          }
        } catch (e) {}
      }
    };
    initApp();
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const current = await getVersion();
        setAppVersion(current);
        const response = await fetch('https://api.github.com/repos/theonestory/robotnichkoff/releases/latest');
        if (!response.ok) return;
        const data = await response.json();
        const latest = (data?.tag_name || "").replace('v', '');
        
        if (latest && latest !== current) {
          setUpdateInfo(prev => {
            if (prev.version === latest) return prev;
            return { show: true, version: latest, notified: true };
          });
        }
      } catch (e) {}
    };

    checkUpdates();
    const intervalId = setInterval(checkUpdates, 30 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (filterSite === "all" || pendingVacancies.length === 0 || view !== "search") return;
    const domains: Record<string, string> = { hh: "hh.ru", habr: "habr.com", superjob: "superjob.ru", zarplata: "zarplata.ru" };
    const reqDomain = domains[filterSite];

    const matching = pendingVacancies.filter(v => v.link.toLowerCase().includes(reqDomain));
    if (matching.length > 0) {
       setPendingVacancies(prev => prev.filter(v => !v.link.toLowerCase().includes(reqDomain)));
       setAllVacancies(prev => [...matching.filter(m => !prev.some(a => isDuplicate(a, m))), ...prev]);
    }
  }, [filterSite, pendingVacancies, view]);

  useEffect(() => {
    if (!activeSearch || view !== "search") return;
    const intervalId = setInterval(async () => {
      const sites = ["hh", "habr", "superjob", "zarplata"];
      let foundNew = false;
      let newItems: Vacancy[] = [];
      const savedVisited: Vacancy[] = JSON.parse(localStorage.getItem("jobSonar_visited") || "[]");

      for (const s of sites) {
        try {
          const { loc, fmt } = getSearchParams(s);
          const res = await invoke<Vacancy[]>("search_jobs", { query: activeSearch, site: s, page: 0, location: loc, workFormat: fmt });
          if (Array.isArray(res) && res.length > 0) {
            const validRes = res.filter(v => isJobMatch(v.title, activeSearch, v.link));
            const fresh = validRes.filter(newVac => 
              !allVacanciesRef.current.some(oldVac => isDuplicate(oldVac, newVac)) &&
              !pendingVacanciesRef.current.some(pVac => isDuplicate(pVac, newVac)) &&
              !savedVisited.some(visited => isDuplicate(visited, newVac)) 
            );
            if (fresh.length > 0) {
              foundNew = true;
              newItems = [...newItems, ...fresh];
            }
          }
        } catch (e) {}
      }

      if (foundNew && newItems.length > 0) {
        if (audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.volume = 0.5;
          audioRef.current.play().catch(e => console.log("Sound play error:", e));
        }

        setPendingVacancies(prev => {
           const updatedPending = [...newItems, ...prev];
           sendNotification({ title: t.push_title, body: t.push_body.replace("{count}", updatedPending.length.toString()) });
           return updatedPending;
        });
      }
    }, 180000); 
    return () => clearInterval(intervalId);
  }, [activeSearch, view, t]);

  const handleSearch = async (forcedQuery?: string) => {
    let query = typeof forcedQuery === 'string' ? forcedQuery : (searchQuery || "").trim();
    if (!query) return;

    if (audioRef.current) {
      audioRef.current.muted = true;
      audioRef.current.play().then(() => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.muted = false;
        }
      }).catch(() => {});
    }

    const correctedQuery = fixLayoutTypo(query);
    if (correctedQuery !== query) {
        query = correctedQuery;
        setSearchQuery(correctedQuery);
    }
    
    if (!forcedQuery && (isLoading || isFetchingBackground)) return;
    
    setActiveSearch(query); setHasSearched(true); setIsLoading(true); setIsFetchingBackground(false);
    setView("search"); setFilterSite("all"); setAllVacancies([]); setPendingVacancies([]); 
    setDisplayCount(20); setNextFetchPage(1); trackEvent("search_v1_1", { query });

    const sites = ["hh", "habr", "superjob", "zarplata"];
    let initialAcc: Vacancy[] = [];

    for (const s of sites) {
      try {
        const { loc, fmt } = getSearchParams(s);
        const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: 0, location: loc, workFormat: fmt });
        if (Array.isArray(res)) {
            const validRes = res.filter(v => isJobMatch(v.title, query, v.link));
            initialAcc = [...initialAcc, ...validRes.filter(v => !initialAcc.some(a => isDuplicate(a, v)))];
            setAllVacancies(shuffleResults([...initialAcc])); 
        }
      } catch (e) {}
    }
    setIsLoading(false);
    backgroundFetch(query, 1, 3);
  };

  const backgroundFetch = async (query: string, startPage: number, count: number) => {
    setIsFetchingBackground(true);
    try {
      for (let p = startPage; p < startPage + count; p++) {
        const sites = ["hh", "habr", "superjob", "zarplata"];
        let pageItems: Vacancy[] = [];
        for (const s of sites) {
            try {
                const { loc, fmt } = getSearchParams(s);
                const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: p, location: loc, workFormat: fmt });
                if (Array.isArray(res)) pageItems = [...pageItems, ...res.filter(v => isJobMatch(v.title, query, v.link))];
            } catch (e) {}
        }
        if (pageItems.length > 0) {
            setAllVacancies(prev => [...prev, ...shuffleResults(pageItems.filter(pItem => !prev.some(a => isDuplicate(a, pItem))))]);
        }
        setNextFetchPage(p + 1);
      }
    } catch (e) {} finally { setIsFetchingBackground(false); }
  };

  const handleShowMore = () => {
    const next = displayCount + 20;
    setDisplayCount(next);
    if (view === "search" && allVacancies.length - next < 30 && !isFetchingBackground) backgroundFetch(activeSearch, nextFetchPage, 3);
  };

  const handleOpenLink = (v: Vacancy) => {
    if (!v?.link) return;
    if (!v.link.toLowerCase().includes("github.com") && !v.link.toLowerCase().includes("linkedin.com")) {
      setVisitedVacancies(prev => {
        if (prev.some(item => getBaseLink(item.link) === getBaseLink(v.link))) return prev;
        const next = [v, ...prev];
        localStorage.setItem("jobSonar_visited", JSON.stringify(next));
        return next;
      });
    }
    invoke("open_browser", { url: v.link });
  };

  const toggleFavorite = (v: Vacancy) => {
    if (!v?.link) return;
    const isFav = favorites.some(f => getBaseLink(f.link) === getBaseLink(v.link));
    const newFavs = isFav ? favorites.filter(f => getBaseLink(f.link) !== getBaseLink(v.link)) : [...favorites, v];
    setFavorites(newFavs); invoke("save_favorites", { items: newFavs });
  };

  const handleOpenSettings = () => {
    setDraftCountry(activeCountry);
    setDraftCity(activeCity);
    setDraftFormat(activeFormat);
    setDraftSalary(activeSalary);
    setDraftLang(activeLang);
    setIsFiltersOpen(true);
  };

  const handleSaveFilters = () => {
    setIsSavingFilters(true);
    
    const isApiFilterChanged = draftCountry !== activeCountry || draftCity !== activeCity || draftFormat !== activeFormat;
    
    filterRefs.current = { city: draftCity, format: draftFormat, country: draftCountry };

    setTimeout(() => {
      setActiveCountry(draftCountry);
      setActiveCity(draftCity);
      setActiveFormat(draftFormat);
      setActiveSalary(draftSalary);
      setActiveLang(draftLang);
      setIsSavingFilters(false);
      setIsSavedSuccess(true);
      
      if (isApiFilterChanged && hasSearched && activeSearch) {
        handleSearch(activeSearch);
      }

      // Окно больше не закрывается автоматически! Пользователь закроет его крестиком.
      // Сбрасываем только зеленую галочку на кнопке через 1.5 секунды
      setTimeout(() => {
        setIsSavedSuccess(false);
      }, 1500);
    }, 600);
  };

  const filteredList = useMemo(() => {
    const rawList = view === "search" ? allVacancies : view === "favorites" ? favorites : visitedVacancies;
    if (!Array.isArray(rawList)) return [];

    return rawList.filter(v => {
      if (!v) return false;
      if (filterSite !== "all") {
        const domains: Record<string, string> = { hh: "hh.ru", habr: "habr.com", superjob: "superjob.ru", zarplata: "zarplata.ru" };
        if (domains[filterSite] && !v.link.toLowerCase().includes(domains[filterSite])) return false;
      }
      if (view !== "search" && activeSearch) {
        if (!isJobMatch(v.title, activeSearch, v.link)) return false;
      }
      
      const isSalaryMissing = (v?.salary || "").toLowerCase().includes("не указана") || (v?.salary || "") === "";
      if (activeSalary === "with_salary" && isSalaryMissing) return false;
      if (activeSalary === "without_salary" && !isSalaryMissing) return false;

      return true;
    });
  }, [allVacancies, favorites, visitedVacancies, filterSite, view, activeSearch, activeSalary]);

  const displayedList = filteredList.slice(0, displayCount);
  const currentFilterIndex = FILTER_SITES.findIndex(s => s.id === filterSite);

  const hasDraftChanges = draftCountry !== activeCountry || draftCity !== activeCity || draftFormat !== activeFormat || draftSalary !== activeSalary || draftLang !== activeLang;
  const isFilterActiveGlobally = activeCountry !== "all" || activeCity !== "all_any" || activeFormat !== "any" || activeSalary !== "all";
  
  const isSearchCompleted = hasSearched && !isLoading && !isFetchingBackground && activeSearch === searchQuery && searchQuery.trim() !== "";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault(); 
      if (searchQuery.trim() && !isLoading && !isFetchingBackground) {
        handleSearch();
      }
    }
  };

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300 relative">
      <audio ref={audioRef} src={notiSound} preload="auto" />
      
      <aside className="w-64 border-r flex flex-col p-6 shrink-0 z-20 transition-all shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-black italic tracking-tighter mb-10 px-2 transition-colors" style={{ color: theme === 'light' ? '#3F3F46' : '#FFFFFF' }}>{t.app_name}</h1>
        
        <nav className="space-y-3 flex-1">
          <button 
            onClick={() => { setView("search"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all outline-none ${view === "search" ? 'bg-[#3F3F46] text-white shadow-lg' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            {t.nav_search}
          </button>
          
          <button 
            onClick={() => { setView("favorites"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all outline-none ${view === "favorites" ? 'bg-[#3F3F46] text-white shadow-lg' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            <span>{t.nav_favs}</span>
            {favorites.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-2 transition-colors ${view === "favorites" ? "bg-white text-[#3F3F46]" : "bg-[var(--text-dim)] text-white"}`}>{favorites.length}</span>}
          </button>
          
          <button 
            onClick={() => { setView("history"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all outline-none ${view === "history" ? 'bg-[#3F3F46] text-white shadow-lg' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10'}`}
          >
            <span>{t.nav_history}</span>
            {visitedVacancies.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-2 transition-colors ${view === "history" ? "bg-white text-[#3F3F46]" : "bg-[var(--text-dim)] text-white"}`}>{visitedVacancies.length}</span>}
          </button>
        </nav>
        
        <div className="theme-toggle-container pt-4">
          <div className="theme-toggle-switch" data-theme={theme} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            <div className="theme-toggle-pill" />
            <div className={`theme-label ${theme === 'light' ? 'active' : ''}`}>{t.theme_light}</div>
            <div className={`theme-label ${theme === 'dark' ? 'active' : ''}`}>{t.theme_dark}</div>
          </div>
        </div>

        <div 
          onClick={() => invoke("open_browser", { url: "https://www.linkedin.com/in/andreevav/" })} 
          className="author-credit"
        >
          {t.contact_author}
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 transition-colors relative" style={{ backgroundColor: 'var(--bg-app)' }}>
        
        {(isLoading || isFetchingBackground) && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-[90] pointer-events-none">
            <div className="px-6 py-3.5 rounded-full flex items-center gap-4 shadow-2xl border pointer-events-auto transition-colors" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3F3F46] opacity-50"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#3F3F46]"></span></span>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-main)' }}>{isLoading ? t.loading_search : t.loading_bg}</span>
            </div>
          </div>
        )}

        {updateInfo.show && (
          <div className="bg-[#3F3F46] text-white px-10 py-3 flex justify-between items-center shadow-lg z-30">
            <span className="text-sm font-black uppercase">{t.update_available} v{updateInfo.version}</span>
            <button onClick={() => invoke("open_browser", { url: "https://github.com/theonestory/robotnichkoff/releases/latest" })} className="bg-white text-[#3F3F46] px-6 py-1.5 rounded-xl text-xs font-black shadow-md">{t.update_btn}</button>
          </div>
        )}
        
        <header className="border-b px-10 py-6 z-10 shadow-sm shrink-0" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-4 max-w-4xl w-full">
            <div className="flex items-center gap-3 w-full">
              
              <div className="relative flex-1 flex items-center">
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={handleKeyDown} 
                  className="w-full px-6 py-3.5 pr-14 rounded-2xl text-sm font-bold outline-none transition-colors shadow-inner" 
                  style={{ backgroundColor: 'var(--input-bg)' }} 
                  placeholder={t.search_placeholder} 
                />
                
                <div className="absolute right-2 flex items-center">
                  {isLoading || isFetchingBackground ? (
                    <div className="p-2.5 rounded-xl opacity-40" style={{ color: 'var(--text-main)' }}>
                      <span className="relative flex h-4 w-4 m-[1px]"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-50"></span><span className="relative inline-flex rounded-full h-4 w-4 bg-current"></span></span>
                    </div>
                  ) : isSearchCompleted ? (
                    <button 
                      onClick={() => { setSearchQuery(""); setActiveSearch(""); setHasSearched(false); setAllVacancies([]); setPendingVacancies([]); }} 
                      className="p-2.5 rounded-xl opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all outline-none" 
                      style={{ color: 'var(--text-main)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleSearch()} 
                      disabled={!searchQuery.trim()} 
                      className="p-2.5 rounded-xl opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all outline-none disabled:opacity-20" 
                      style={{ color: 'var(--text-main)' }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    </button>
                  )}
                </div>
              </div>

              <button 
                onClick={handleOpenSettings} 
                className="relative w-[48px] h-[48px] shrink-0 flex items-center justify-center rounded-2xl opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/5 transition-all active:scale-95 outline-none"
                style={{ color: 'var(--text-main)' }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                {isFilterActiveGlobally && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)] border-[1.5px] border-white dark:border-[#161618]"></span>
                )}
              </button>
            </div>
            
            <div className="ios-slider-container max-w-4xl mt-1">
              <div className="ios-slider-pill" style={{ left: `calc(${currentFilterIndex} * 20% + 4px)`, width: 'calc(20% - 8px)' }} />
              {FILTER_SITES.map(s => <div key={s.id} onClick={() => setFilterSite(s.id)} className="ios-slider-item" style={{ color: filterSite === s.id ? 'var(--text-main)' : 'var(--text-dim)' }}>{s.id === "all" ? (activeLang === "ru" ? "ВСЕ" : "ALL") : s.label}</div>)}
            </div>
          </div>
        </header>

        <section ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar relative scroll-smooth">
          {pendingVacancies.length > 0 && view === "search" && filterSite === "all" && (
            <div className="sticky top-0 z-40 flex justify-center w-full pointer-events-none">
              <button
                onClick={() => {
                  setAllVacancies(prev => {
                     const uniquePending = pendingVacancies.filter(p => !prev.some(a => isDuplicate(a, p)));
                     return [...uniquePending, ...prev];
                  });
                  setPendingVacancies([]);
                  if (scrollRef.current) scrollRef.current.scrollTop = 0;
                }}
                className="absolute top-2 bg-[#10B981] text-white px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(16,185,129,0.3)] hover:scale-105 transition-transform flex items-center gap-2 animate-bounce pointer-events-auto"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                {t.new_vacancies} ({pendingVacancies.length})
              </button>
            </div>
          )}

          {(view === "search" && hasSearched && filteredList.length === 0) || (view !== "search" && filteredList.length === 0) ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
              <p className="text-[12px] font-black uppercase tracking-[0.2em] text-center">{view === "favorites" ? t.empty_favs : view === "history" ? t.empty_history : t.empty_search}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10">
              {displayedList.map((v, index) => {
                const safeKey = `${getBaseLink(v?.link) || index}-${index}`;
                const isFav = favorites.some(f => getBaseLink(f?.link) === getBaseLink(v?.link));
                const isVisitedInSearch = visitedVacancies.some(historyItem => getBaseLink(historyItem?.link) === getBaseLink(v?.link));
                const shouldMute = isVisitedInSearch && view !== "history";
                const isSalaryMissing = (v?.salary || "").toLowerCase().includes("не указана") || (v?.salary || "") === "";

                return (
                  <div key={safeKey} onClick={() => handleOpenLink(v)} className={`vacancy-card cursor-pointer group ${shouldMute ? 'visited-card' : ''}`}>
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="service-logo-container"><ServiceLogo link={v?.link || ""} /></div>
                      <div className="text-stack flex-1 min-w-0">
                        <h3 className="vacancy-title truncate">{v?.title || t.no_title}</h3>
                        <p className="company-name text-xs font-medium mt-1 truncate" style={{ color: 'var(--text-dim)' }}>{v?.company || t.no_company}</p>
                        <p className="salary-line text-xs font-bold mt-1 truncate" style={{ color: isSalaryMissing ? '#EF4444' : '#10B981' }}>{isSalaryMissing ? t.salary_missing : `${t.salary_prefix}${v?.salary || ""}`}</p>
                      </div>
                    </div>
                    <div className="actions-area flex items-center gap-3 ml-6 shrink-0">
                      <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(v); }} className="round-btn relative z-10">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isFav ? "icon-fav-active text-red-500" : ""}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredList.length > displayCount && !isLoading && (
                  <div className="flex justify-center mt-8 pb-12">
                      <button onClick={handleShowMore} className="text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-60 hover:opacity-100 active:scale-95 outline-none" style={{ color: 'var(--text-dim)' }}>{t.show_more}</button>
                  </div>
              )}
            </div>
          )}
        </section>
      </main>

      <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ease-in-out ${isFiltersOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: 'var(--bg-app)' }}>
        <button onClick={() => setIsFiltersOpen(false)} className="absolute top-8 right-10 p-3 rounded-2xl opacity-40 hover:opacity-100 transition-all hover:scale-105 active:scale-95 outline-none" style={{ backgroundColor: 'var(--bg-side)', color: 'var(--text-main)' }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="flex flex-col items-center w-full max-w-sm gap-8 px-6">
          <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>{t.settings_title}</h2>
          
          <div className="w-full flex flex-col gap-5">
            <CustomSelect 
              label={t.filter_country} 
              options={localizedCountries} 
              selectedId={draftCountry} 
              onSelect={(id) => { 
                setDraftCountry(id); 
                setDraftCity(CITIES[id]?.[0]?.id || "all_any"); 
              }} 
              placeholder={t.select_placeholder}
            />
            
            <CustomSelect 
              label={t.filter_city} 
              options={localizedCities} 
              selectedId={draftCity} 
              onSelect={setDraftCity} 
              placeholder={t.select_placeholder}
            />

            <CustomSelect 
              label={t.filter_format} 
              options={localizedWorkFormats} 
              selectedId={draftFormat} 
              onSelect={setDraftFormat} 
              placeholder={t.select_placeholder}
            />

            <CustomSelect 
              label={t.filter_salary} 
              options={getSalaryFilters(activeLang)} 
              selectedId={draftSalary} 
              onSelect={setDraftSalary} 
              placeholder={t.select_placeholder}
            />

            <CustomSelect 
              label={t.filter_lang} 
              options={LANG_FILTERS} 
              selectedId={draftLang} 
              onSelect={(id) => setDraftLang(id as "ru" | "en")} 
              placeholder={t.select_placeholder}
            />
          </div>

          <button 
            onClick={handleSaveFilters}
            disabled={!hasDraftChanges || isSavingFilters || isSavedSuccess}
            className={`mt-4 w-full py-4 rounded-2xl text-sm font-black tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              hasDraftChanges || isSavedSuccess
                ? "shadow-xl active:scale-95 opacity-100 cursor-pointer"
                : "opacity-40 cursor-not-allowed"
            }`}
            style={{ 
              backgroundColor: isSavedSuccess ? '#10B981' : 'var(--text-main)', 
              color: 'var(--bg-app)',
              transform: isSavedSuccess ? 'scale(1.02)' : 'scale(1)'
            }}
          >
            {isSavingFilters ? (
              <span className="relative flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span></span>
            ) : isSavedSuccess ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                {t.btn_applied}
              </>
            ) : (
              t.btn_apply
            )}
          </button>
        </div>

        <div className="absolute bottom-8 right-10 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] opacity-30 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-main)' }}>
          <button onClick={() => invoke("open_browser", { url: "https://github.com/theonestory/robotnichkoff" })} className="hover:underline outline-none transition-colors">GitHub</button>
          <span style={{ color: 'var(--text-dim)' }}>|</span>
          <span>{t.version} {appVersion}</span>
        </div>
      </div>
    </div>
  );
}

function App() { return ( <AptabaseProvider appKey="A-US-3662138873"><ApplicationContent /></AptabaseProvider> ); }
export default App;