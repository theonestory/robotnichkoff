import { useState, useEffect, useMemo, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { AptabaseProvider, useAptabase } from "@aptabase/react";
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/plugin-notification';
import "./App.css";

import { DICT } from "./constants/dictionary";
import { LANG_FILTERS, getSalaryFilters } from "./constants/filters";
import { 
  Vacancy, shuffleResults, getSafeLink, getBaseLink, isDuplicate, fixLayoutTypo 
} from "./utils/helpers";
import { isJobMatch } from "./filters/filterEngine";
import { COUNTRIES, CITIES, WORK_FORMATS } from "./filters/locations";

import Sidebar, { FILTER_SITES } from "./components/Sidebar";
import Header from "./components/Header";
import VacancyCard from "./components/VacancyCard";
import SettingsModal from "./components/SettingsModal";

import notiSound from "./assets/noti-robo.wav";

import hhLogo from "./assets/logos/hh.svg";
import habrLogo from "./assets/logos/habr.svg";
import sjLogo from "./assets/logos/superjob.svg";
import zarplataLogo from "./assets/logos/zarplata.svg";
import geekjobLogo from "./assets/logos/geekjob.svg"; 
import trudvsemLogo from "./assets/logos/trudvsem.svg";
import remotejobLogo from "./assets/logos/remote-job.svg";
import rabotaruLogo from "./assets/logos/rabotaru.svg";

// Словарь для перевода интерфейса
const LOCATIONS_EN: Record<string, string> = {
  "Везде": "Anywhere", "Россия и СНГ": "Russia & CIS", "СНГ": "CIS", "Европа": "Europe", "США": "USA",
  "MENA": "MENA", "Азия": "Asia", "ОАЭ": "UAE", "Турция": "Turkey", "Саудовская Аравия": "Saudi Arabia", 
  "Египет": "Egypt", "Израиль": "Israel", "Таиланд": "Thailand", "Индонезия": "Indonesia", 
  "Филиппины": "Philippines", "Вьетнам": "Vietnam", "Индия": "India", "Китай": "China",
  "Россия": "Russia", "Беларусь": "Belarus", "Казахстан": "Kazakhstan", "Армения": "Armenia", 
  "Грузия": "Georgia", "Азербайджан": "Azerbaijan", "Кыргызстан": "Kyrgyzstan", "Молдова": "Moldova",
  "Таджикистан": "Tajikistan", "Туркменистан": "Turkmenistan", "Узбекистан": "Uzbekistan",
  "Германия": "Germany", "Великобритания": "UK", "Польша": "Poland", "Кипр": "Cyprus", 
  "Сербия": "Serbia", "Нидерланды": "Netherlands", "Франция": "France", "Испания": "Spain", "Италия": "Italy",
  "Все локации": "All locations", "Вся Россия и СНГ": "All Russia & CIS", "Все страны СНГ (без РФ)": "All CIS (except RU)",
  "Все страны Европы": "All Europe", "Все США": "All USA", "Все страны MENA": "All MENA", "Вся Азия": "All Asia",
  "Вся Россия": "All Russia", "Вся Беларусь": "All Belarus", "Весь Казахстан": "All Kazakhstan", "Вся Армения": "All Armenia", 
  "Вся Грузия": "All Georgia", "Весь Азербайджан": "All Azerbaijan", "Весь Кыргызстан": "All Kyrgyzstan", 
  "Вся Молдова": "All Moldova", "Весь Таджикистан": "All Tajikistan", "Весь Туркменистан": "All Turkmenistan", 
  "Весь Узбекистан": "All Uzbekistan", "Вся Германия": "All Germany", "Вся Великобритания": "All UK", 
  "Вся Польша": "All Poland", "Весь Кипр": "All Cyprus", "Вся Сербия": "All Serbia", "Все Нидерланды": "All Netherlands", 
  "Вся Франция": "All France", "Вся Испания": "All Spain", "Все ОАЭ": "All UAE", "Вся Турция": "All Turkey", 
  "Весь Таиланд": "All Thailand", "Вся Индонезия": "All Indonesia", "Все Филиппины": "All Philippines",
  "Москва": "Moscow", "Санкт-Петербург": "St. Petersburg", "Новосибирск": "Novosibirsk", "Екатеринбург": "Yekaterinburg",
  "Казань": "Kazan", "Нижний Новгород": "Nizhny Novgorod", "Челябинск": "Chelyabinsk", "Самара": "Samara",
  "Уфа": "Ufa", "Ростов-на-Дону": "Rostov-on-Don", "Краснодар": "Krasnodar", "Воронеж": "Voronezh", "Пермь": "Perm",
  "Волгоград": "Volgograd", "Красноярск": "Krasnoyarsk", "Омск": "Omsk", "Калининград": "Kaliningrad",
  "Владивосток": "Vladivostok", "Томск": "Tomsk", "Тюмень": "Tyumen", "Саратов": "Saratov",
  "Минск": "Minsk", "Гомель": "Gomel", "Витебск": "Vitebsk", "Могилев": "Mogilev", "Гродно": "Grodno", "Брест": "Brest",
  "Алматы": "Almaty", "Астана": "Astana", "Шымкент": "Shymkent", "Караганда": "Karaganda",
  "Ереван": "Yerevan", "Гюмри": "Gyumri", "Тбилиси": "Tbilisi", "Батуми": "Batumi", "Баку": "Baku",
  "Бишкек": "Bishkek", "Кишинев": "Chisinau", "Душанбе": "Dushanbe", "Ашхабад": "Ashgabat", "Ташкент": "Tashkent",
  "Берлин": "Berlin", "Мюнхен": "Munich", "Франкфурт": "Frankfurt", "Лондон": "London", "Манчестер": "Manchester",
  "Варшава": "Warsaw", "Краков": "Krakow", "Лимассол": "Limassol", "Никосия": "Nicosia", "Белград": "Belgrade",
  "Нови-Сад": "Novi Sad", "Амстердам": "Amsterdam", "Роттердам": "Rotterdam", "Париж": "Paris",
  "Марсель": "Marseille", "Мадрид": "Madrid", "Барселона": "Barcelona", "Нью-Йорк": "New York",
  "Сан-Франциско": "San Francisco", "Лос-Анджелес": "Los Angeles", "Сиэтл": "Seattle", "Чикаго": "Chicago",
  "Дубай": "Dubai", "Абу-Даби": "Abu Dhabi", "Стамбул": "Istanbul", "Анталья": "Antalya", 
  "Бангкок": "Bangkok", "Пхукет": "Phuket", "Бали": "Bali", "Джакарта": "Jakarta", "Манила": "Manila"
};

const isSiteMatch = (link: string, site: string) => {
  const lower = getSafeLink(link).toLowerCase();
  if (site === "hh") return lower.includes("hh.") || lower.includes("rabota.by") || lower.includes("api.hh.");
  const domains: Record<string, string> = { habr: "habr.com", superjob: "superjob.ru", zarplata: "zarplata.ru", geekjob: "geekjob.ru", trudvsem: "trudvsem.ru", remotejob: "remote-job.ru", rabotaru: "rabota.ru" };
  return domains[site] ? lower.includes(domains[site]) : false;
};

const ServiceLogo = ({ link }: { link: string }) => {
  if (isSiteMatch(link, "hh")) return <img src={hhLogo} alt="HH" className="w-full h-full block" />;
  if (isSiteMatch(link, "habr")) return <img src={habrLogo} alt="Habr" className="w-full h-full block" />;
  if (isSiteMatch(link, "superjob")) return <img src={sjLogo} alt="SJ" className="w-full h-full block" />;
  if (isSiteMatch(link, "zarplata")) return <img src={zarplataLogo} alt="Zarplata" className="w-full h-full block" />;
  if (isSiteMatch(link, "geekjob")) return <img src={geekjobLogo} alt="Geekjob" className="w-full h-full block" />;
  if (isSiteMatch(link, "trudvsem")) return <img src={trudvsemLogo} alt="Trudvsem" className="w-full h-full block" />;
  if (isSiteMatch(link, "remotejob")) return <img src={remotejobLogo} alt="Remote" className="w-full h-full block" />;
  if (isSiteMatch(link, "rabotaru")) return <img src={rabotaruLogo} alt="Rabota" className="w-full h-full block" />;
  return (
    <div className="w-full h-full rounded-full flex items-center justify-center bg-black/10 dark:bg-white/10">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 opacity-40"><rect x="3" y="11" width="18" height="10" rx="2"/><circle cx="12" cy="5" r="2"/><path d="M12 7v4M8 16h.01M16 16h.01"/></svg>
    </div>
  );
};

function ApplicationContent() {
  const [activeLang, setActiveLang] = useState<"ru" | "en">((localStorage.getItem("jobSonar_lang") as "ru" | "en") || "ru");
  const t = DICT[activeLang];

  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [visitedVacancies, setVisitedVacancies] = useState<Vacancy[]>([]);
  const [deletedVacancies, setDeletedVacancies] = useState<Vacancy[]>([]);
  const [deletingLinks, setDeletingLinks] = useState<string[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  const [filterSite, setFilterSite] = useState("all");
  const [view, setView] = useState<"search" | "favorites" | "history" | "deleted">("search");
  
  const [appVersion, setAppVersion] = useState("1.1.1");
  const [, setUpdateInfo] = useState<{show: boolean, version: string, notified: boolean}>({ show: false, version: "", notified: false });

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
  const deletedVacanciesRef = useRef(deletedVacancies);
  const { trackEvent } = useAptabase();

  const filterRefs = useRef({ city: activeCity, format: activeFormat, country: activeCountry });
  
  // ИСПРАВЛЕНО: Возвращен перевод из словаря LOCATIONS_EN для стран
  const localizedCountries = useMemo(() => COUNTRIES.map(c => ({
    ...c, name: activeLang === 'en' ? (LOCATIONS_EN[c.name] || c.name) : c.name
  })), [activeLang]);

  // ИСПРАВЛЕНО: Возвращен перевод из словаря LOCATIONS_EN для городов, добавлен activeLang в зависимости
  const localizedCities = useMemo(() => {
    const cityList = CITIES[draftCountry] || CITIES["all"];
    return cityList.map(c => ({ ...c, name: activeLang === 'en' ? (LOCATIONS_EN[c.name] || c.name) : c.name }));
  }, [draftCountry, activeLang]);

  const localizedWorkFormats = useMemo(() => WORK_FORMATS.map(f => {
    if (f.id === 'any') return { ...f, name: activeLang === 'ru' ? 'Любой формат' : 'Any format' };
    if (f.id === 'remote') return { ...f, name: activeLang === 'ru' ? 'Удаленная работа' : 'Remote' };
    if (f.id === 'office') return { ...f, name: activeLang === 'ru' ? 'Офис / Гибрид' : 'Office / Hybrid' };
    return f;
  }), [activeLang]);

  useEffect(() => { allVacanciesRef.current = allVacancies; }, [allVacancies]);
  useEffect(() => { pendingVacanciesRef.current = pendingVacancies; }, [pendingVacancies]);
  useEffect(() => { deletedVacanciesRef.current = deletedVacancies; }, [deletedVacancies]);
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

  useEffect(() => { invoke("update_badge", { count: pendingVacancies.length }).catch(() => {}); }, [pendingVacancies.length]);

  // ПОЛНОСТЬЮ ОТКЛЮЧЕННЫЙ ГЕО-ФИЛЬТР. ПЕРЕДАЕМ ТОЛЬКО ФОРМАТ РАБОТЫ.
  const getSearchParams = (site: string) => {
    const { format } = filterRefs.current;
    const formatObj = WORK_FORMATS.find(f => f.id === format) || WORK_FORMATS[0];
    
    let fmt = "";
    if (site === "hh" || site === "zarplata") { fmt = String(formatObj.hh || ""); }
    else if (site === "habr") { fmt = String(formatObj.habr || ""); }
    else if (site === "superjob") { fmt = String(formatObj.sj || ""); }
    
    return { loc: "", fmt };
  };

  useEffect(() => {
    const initApp = async () => {
      let permission = await isPermissionGranted();
      if (!permission) permission = await requestPermission() === 'granted';
      trackEvent("app_opened", { version: appVersion });
      invoke<Vacancy[]>("load_favorites").then(res => { if (Array.isArray(res)) setFavorites(res); }).catch(() => setFavorites([]));
      const savedVisited = localStorage.getItem("jobSonar_visited");
      if (savedVisited) { try { const parsed = JSON.parse(savedVisited); if (Array.isArray(parsed)) setVisitedVacancies(parsed); } catch (e) {} }
      const savedDeleted = localStorage.getItem("jobSonar_deleted");
      if (savedDeleted) { try { const parsed = JSON.parse(savedDeleted); if (Array.isArray(parsed)) setDeletedVacancies(parsed); } catch (e) {} }
    };
    initApp();
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme, appVersion, trackEvent]);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const current = await getVersion(); setAppVersion(current);
        const response = await fetch('https://api.github.com/repos/theonestory/robotnichkoff/releases/latest');
        if (!response.ok) return;
        const data = await response.json(); const latest = (data?.tag_name || "").replace('v', '');
        if (latest && latest !== current) setUpdateInfo(prev => ({ ...prev, show: true, version: latest, notified: true }));
      } catch (e) {}
    };
    checkUpdates(); setInterval(checkUpdates, 30 * 60 * 1000);
  }, []);

  useEffect(() => {
    if (filterSite === "all" || pendingVacancies.length === 0 || view !== "search") return;
    const matching = pendingVacancies.filter(v => isSiteMatch(getSafeLink(v), filterSite));
    if (matching.length > 0) {
       setPendingVacancies(prev => prev.filter(v => !isSiteMatch(getSafeLink(v), filterSite)));
       setAllVacancies(prev => [...matching.filter(m => !prev.some(a => isDuplicate(a, m))), ...prev]);
    }
  }, [filterSite, pendingVacancies, view]);

  useEffect(() => {
    if (!activeSearch || view !== "search") return;
    const intervalId = setInterval(async () => {
      const sites = FILTER_SITES.filter(s => s.id !== 'all').map(s => s.id);
      let foundNew = false; let newItems: Vacancy[] = [];
      const savedVisited: Vacancy[] = JSON.parse(localStorage.getItem("jobSonar_visited") || "[]");
      for (const s of sites) {
        try {
          const { loc, fmt } = getSearchParams(s);
          const res = await invoke<Vacancy[]>("search_jobs", { query: activeSearch, site: s, page: 0, location: loc, workFormat: fmt });
          if (Array.isArray(res) && res.length > 0) {
            const validRes = res.filter(v => isJobMatch(v.title, activeSearch, getSafeLink(v)));
            const fresh = validRes.filter(newVac => 
              !allVacanciesRef.current.some(oldVac => isDuplicate(oldVac, newVac)) &&
              !pendingVacanciesRef.current.some(pVac => isDuplicate(pVac, newVac)) &&
              !savedVisited.some(visited => isDuplicate(visited, newVac)) &&
              !deletedVacanciesRef.current.some(del => isDuplicate(del, newVac))
            );
            if (fresh.length > 0) { foundNew = true; newItems = [...newItems, ...fresh]; }
          }
        } catch (e) {}
      }
      if (foundNew && newItems.length > 0) {
        if (audioRef.current) { audioRef.current.currentTime = 0; audioRef.current.play().catch(() => {}); }
        setPendingVacancies(prev => {
           const updatedPending = [...newItems, ...prev];
           sendNotification({ title: t.push_title, body: t.push_body.replace("{count}", updatedPending.length.toString()) });
           return updatedPending;
        });
      }
    }, 180000); return () => clearInterval(intervalId);
  }, [activeSearch, view, t]);

  const handleSearch = async (forcedQuery?: string) => {
    let query = typeof forcedQuery === 'string' ? forcedQuery : (searchQuery || "").trim();
    if (!query) return;
    const correctedQuery = fixLayoutTypo(query);
    if (correctedQuery !== query) { query = correctedQuery; setSearchQuery(correctedQuery); }
    if (!forcedQuery && (isLoading || isFetchingBackground)) return;
    setActiveSearch(query); setHasSearched(true); setIsLoading(true); setView("search"); setFilterSite("all"); setAllVacancies([]); setPendingVacancies([]); setDisplayCount(20); setNextFetchPage(1);
    
    const sites = FILTER_SITES.filter(s => s.id !== 'all').map(s => s.id);
    let initialAcc: Vacancy[] = [];
    
    for (const s of sites) {
      try {
        const { loc, fmt } = getSearchParams(s);
        const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: 0, location: loc, workFormat: fmt });
        if (Array.isArray(res)) {
            const validRes = res.filter(v => isJobMatch(v.title, query, getSafeLink(v)));
            const notDeleted = validRes.filter(v => !deletedVacanciesRef.current.some(del => isDuplicate(del, v)));
            initialAcc = [...initialAcc, ...notDeleted.filter(v => !initialAcc.some(a => isDuplicate(a, v)))];
            setAllVacancies(shuffleResults([...initialAcc])); 
        }
      } catch (e) {}
    }
    setIsLoading(false); backgroundFetch(query, 1, 3);
  };

  const backgroundFetch = async (query: string, startPage: number, count: number) => {
    setIsFetchingBackground(true);
    try {
      for (let p = startPage; p < startPage + count; p++) {
        const sites = FILTER_SITES.filter(s => s.id !== 'all').map(s => s.id);
        let pageItems: Vacancy[] = [];
        
        for (const s of sites) {
            try {
                const { loc, fmt } = getSearchParams(s);
                const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: p, location: loc, workFormat: fmt });
                if (Array.isArray(res)) {
                   const matched = res.filter(v => isJobMatch(v.title, query, getSafeLink(v)));
                   const notDeleted = matched.filter(v => !deletedVacanciesRef.current.some(del => isDuplicate(del, v)));
                   pageItems = [...pageItems, ...notDeleted];
                }
            } catch (e) {}
        }
        if (pageItems.length > 0) setAllVacancies(prev => [...prev, ...shuffleResults(pageItems.filter(pItem => !prev.some(a => isDuplicate(a, pItem))))]);
        setNextFetchPage(p + 1);
      }
    } catch (e) {} finally { setIsFetchingBackground(false); }
  };

  const handleShowMore = () => {
    const next = displayCount + 20; setDisplayCount(next);
    if (view === "search" && allVacancies.length - next < 30 && !isFetchingBackground) backgroundFetch(activeSearch, nextFetchPage, 3);
  };

  const handleOpenLink = (v: Vacancy) => {
    const link = getSafeLink(v); if (!link) return;
    if (!link.toLowerCase().includes("github.com") && !link.toLowerCase().includes("linkedin.com")) {
      setVisitedVacancies(prev => { if (prev.some(item => getBaseLink(getSafeLink(item)) === getBaseLink(link))) return prev; const next = [v, ...prev]; localStorage.setItem("jobSonar_visited", JSON.stringify(next)); return next; });
    }
    invoke("open_browser", { url: link });
  };

  const toggleFavorite = (v: Vacancy) => {
    const link = getSafeLink(v); if (!link) return;
    const isFav = favorites.some(f => getBaseLink(getSafeLink(f)) === getBaseLink(link));
    const newFavs = isFav ? favorites.filter(f => getBaseLink(getSafeLink(f)) !== getBaseLink(link)) : [v, ...favorites];
    setFavorites(newFavs); invoke("save_favorites", { items: newFavs });
  };

  const handleDelete = (v: Vacancy) => {
    const link = getSafeLink(v); if (!link) return;
    setDeletingLinks(prev => [...prev, link]);
    setTimeout(() => {
      setDeletedVacancies(prev => { if (prev.some(d => isDuplicate(d, v))) return prev; const next = [v, ...prev]; localStorage.setItem("jobSonar_deleted", JSON.stringify(next)); return next; });
      setAllVacancies(prev => prev.filter(item => !isDuplicate(item, v)));
      setPendingVacancies(prev => prev.filter(item => !isDuplicate(item, v)));
      setFavorites(prev => { const next = prev.filter(item => !isDuplicate(item, v)); invoke("save_favorites", { items: next }); return next; });
      setDeletingLinks(prev => prev.filter(l => l !== link));
    }, 390);
  };

  const restoreDeleted = (v: Vacancy) => {
    setDeletedVacancies(prev => { const next = prev.filter(d => !isDuplicate(d, v)); localStorage.setItem("jobSonar_deleted", JSON.stringify(next)); return next; });
  };

  const handleOpenSettings = () => { setDraftCountry(activeCountry); setDraftCity(activeCity); setDraftFormat(activeFormat); setDraftSalary(activeSalary); setDraftLang(activeLang); setIsFiltersOpen(true); };
  
  const handleSaveFilters = () => {
    setIsSavingFilters(true); const isApiFilterChanged = draftCountry !== activeCountry || draftCity !== activeCity || draftFormat !== activeFormat;
    filterRefs.current = { city: draftCity, format: draftFormat, country: draftCountry };
    setTimeout(() => { setActiveCountry(draftCountry); setActiveCity(draftCity); setActiveFormat(draftFormat); setActiveSalary(draftSalary); setActiveLang(draftLang); setIsSavingFilters(false); setIsSavedSuccess(true); if (isApiFilterChanged && hasSearched && activeSearch) { handleSearch(activeSearch); } setTimeout(() => { setIsSavedSuccess(false); }, 1500); }, 600);
  };

  const filteredList = useMemo(() => {
    const rawList = view === "search" ? allVacancies : view === "favorites" ? favorites : view === "history" ? visitedVacancies : deletedVacancies;
    if (!Array.isArray(rawList)) return [];

    return rawList.filter(v => {
      const link = getSafeLink(v);
      if (filterSite !== "all") {
        if (!isSiteMatch(link, filterSite)) return false;
      }
      if (view !== "search" && activeSearch) { if (!isJobMatch(v.title, activeSearch, link)) return false; }
      const isSalaryMissing = (v?.salary || "").toLowerCase().includes("не указана") || (v?.salary || "") === "";
      if (activeSalary === "with_salary" && isSalaryMissing) return false;
      if (activeSalary === "without_salary" && !isSalaryMissing) return false;
      return true;
    });
  }, [allVacancies, favorites, visitedVacancies, deletedVacancies, filterSite, view, activeSearch, activeSalary]);

  const displayedList = filteredList.slice(0, displayCount);
  const hasDraftChanges = draftCountry !== activeCountry || draftCity !== activeCity || draftFormat !== activeFormat || draftSalary !== activeSalary || draftLang !== activeLang;
  const isFilterActiveGlobally = activeCountry !== "all" || activeCity !== "all_any" || activeFormat !== "any" || activeSalary !== "all";
  const isSearchCompleted = hasSearched && !isLoading && !isFetchingBackground && activeSearch === searchQuery && searchQuery.trim() !== "";

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300 relative">
      <audio ref={audioRef} src={notiSound} preload="auto" />
      
      <Sidebar t={t} theme={theme} setTheme={setTheme} filterSite={filterSite} setFilterSite={setFilterSite} view={view} setView={setView} activeLang={activeLang} invoke={invoke} />

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 transition-colors relative" style={{ backgroundColor: 'var(--bg-app)' }}>
        
        {(isLoading || isFetchingBackground) && (
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[90] pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-300">
             <div className="px-6 py-2.5 rounded-full flex items-center gap-3 shadow-[0_8px_30px_rgba(0,0,0,0.15)] border bg-[#10B981] border-emerald-400/20">
               <span className="relative flex h-2.5 w-2.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span><span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span></span>
               <span className="text-[10px] font-black tracking-[0.15em] uppercase text-white">{isLoading ? t.loading_search : t.loading_bg}</span>
             </div>
          </div>
        )}

        <Header 
          t={t} searchQuery={searchQuery} setSearchQuery={setSearchQuery} handleKeyDown={(e) => { if (e.key === 'Enter' && searchQuery.trim() && !isLoading && !isFetchingBackground) handleSearch(); }}
          isLoading={isLoading} isFetchingBackground={isFetchingBackground} isSearchCompleted={isSearchCompleted}
          onClearSearch={() => { setSearchQuery(""); setActiveSearch(""); setHasSearched(false); setAllVacancies([]); setPendingVacancies([]); }}
          handleSearch={handleSearch} handleOpenSettings={handleOpenSettings} isFilterActiveGlobally={isFilterActiveGlobally}
          view={view} setView={setView} activeLang={activeLang}
        />

        <section ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar relative scroll-smooth">
          {pendingVacancies.length > 0 && view === "search" && filterSite === "all" && (
            <div className="sticky top-6 z-40 flex justify-center items-start w-full pointer-events-none h-0 overflow-visible">
              <button onClick={() => { setAllVacancies(prev => [...pendingVacancies.filter(p => !prev.some(a => isDuplicate(a, p))), ...prev]); setPendingVacancies([]); if (scrollRef.current) scrollRef.current.scrollTop = 0; }} className="bg-[#10B981] text-white px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest shadow-[0_8px_30px_rgba(16,185,129,0.4)] hover:scale-105 transition-transform flex items-center gap-2 animate-bounce pointer-events-auto"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>{t.new_vacancies} ({pendingVacancies.length})</button>
            </div>
          )}

          {filteredList.length === 0 && (!isLoading || view !== "search") ? (
            <div className="h-full flex flex-col items-center justify-center opacity-20"><p className="text-[12px] font-black uppercase tracking-[0.2em] text-center">{view === "favorites" ? t.empty_favs : view === "history" ? t.empty_history : view === "deleted" ? t.empty_deleted : t.empty_search}</p></div>
          ) : (
            <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10">
              {displayedList.map((v, index) => (
                <VacancyCard 
                  key={`${getBaseLink(getSafeLink(v))}-${index}`} v={v} t={t} ServiceLogo={ServiceLogo}
                  isFav={favorites.some(f => getBaseLink(getSafeLink(f)) === getBaseLink(getSafeLink(v)))}
                  shouldMute={visitedVacancies.some(h => getBaseLink(getSafeLink(h)) === getBaseLink(getSafeLink(v))) && view !== "history"}
                  isSalaryMissing={(v?.salary || "").toLowerCase().includes("не указана") || (v?.salary || "") === ""}
                  handleOpenLink={handleOpenLink} toggleFavorite={toggleFavorite}
                  handleDelete={handleDelete} isDeleting={deletingLinks.includes(getSafeLink(v))}
                  view={view} restoreDeleted={restoreDeleted}
                />
              ))}
              {filteredList.length > displayCount && !isLoading && (
                <div className="flex justify-center mt-10 pb-16"><button onClick={handleShowMore} className="group flex items-center gap-3 px-8 py-3 rounded-full border-2 transition-all active:scale-95 outline-none hover:shadow-lg" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-side)', color: 'var(--text-main)' }}><div className="w-5 h-5 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/10 group-hover:scale-110 transition-transform"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg></div><span className="text-[11px] font-black uppercase tracking-[0.2em]">{t.show_more}</span><span className="text-[10px] opacity-40 font-bold">+{filteredList.length - displayCount}</span></button></div>
              )}
            </div>
          )}
        </section>
      </main>

      <SettingsModal 
        isOpen={isFiltersOpen} setIsFiltersOpen={setIsFiltersOpen} t={t} 
        draftCountry={draftCountry} 
        setDraftCountry={(id) => {
          setDraftCountry(id);
          const cList = CITIES[id] || CITIES["all"];
          if (cList && cList.length > 0) setDraftCity(cList[0].id);
        }} 
        draftCity={draftCity} setDraftCity={setDraftCity} 
        draftFormat={draftFormat} setDraftFormat={setDraftFormat} draftSalary={draftSalary} setDraftSalary={setDraftSalary} 
        draftLang={draftLang} setDraftLang={(id) => setDraftLang(id as "ru" | "en")} localizedCountries={localizedCountries} localizedCities={localizedCities} 
        localizedWorkFormats={localizedWorkFormats} getSalaryFilters={getSalaryFilters(activeLang as any)} LANG_FILTERS={LANG_FILTERS}
        handleSaveFilters={handleSaveFilters} isSavingFilters={isSavingFilters} isSavedSuccess={isSavedSuccess} 
        hasDraftChanges={hasDraftChanges} appVersion={appVersion} invoke={invoke}
      />
    </div>
  );
}

function App() { return ( <AptabaseProvider appKey="A-US-3662138873"><ApplicationContent /></AptabaseProvider> ); }
export default App;