import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { AptabaseProvider, useAptabase } from "@aptabase/react";
import "./App.css";

import hhLogo from "./assets/logos/hh.svg";
import habrLogo from "./assets/logos/habr.svg";
import sjLogo from "./assets/logos/superjob.svg";
import zarplataLogo from "./assets/logos/zarplata.svg";

interface Vacancy {
  title: string; link: string; company: string; salary: string;
}

const FILTER_SITES = [
  { id: "all", label: "ВСЕ" }, { id: "hh", label: "HH.RU" }, { id: "habr", label: "HABR" }, { id: "superjob", label: "SUPERJOB" }, { id: "zarplata", label: "ZARPLATA" }
];

const shuffleResults = (array: Vacancy[]) => {
  let currentIndex = array.length, randomIndex;
  const newArray = [...array];
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

const ServiceLogo = ({ link }: { link: string }) => {
  const url = link.toLowerCase();
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

function ApplicationContent() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadMore, setIsLoadMore] = useState(false); // Для индикации загрузки "еще"
  const [searchQuery, setSearchQuery] = useState("Менеджер");
  const [filterSite, setFilterSite] = useState("all");
  const [view, setView] = useState<"search" | "favorites">("search");
  const [visitedVacancies, setVisitedVacancies] = useState<string[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const [updateInfo, setUpdateInfo] = useState<{show: boolean, version: string}>({ show: false, version: "" });
  const [strictMode, setStrictMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(0); // Стейт страницы

  const { trackEvent } = useAptabase();

  useEffect(() => {
    invoke<Vacancy[]>("load_favorites").then(res => setFavorites(res));
    const savedVisited = localStorage.getItem("jobSonar_visited");
    if (savedVisited) setVisitedVacancies(JSON.parse(savedVisited));
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
    trackEvent("theme_changed", { theme });
  }, [theme]);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const current = await getVersion();
        const response = await fetch('https://api.github.com/repos/theonestory/robotnichkoff/releases/latest');
        if (!response.ok) return;
        const data = await response.json();
        const latest = data.tag_name.replace('v', '');
        
        if (latest !== current) {
          setUpdateInfo({ show: true, version: latest });
          trackEvent("update_available", { current, latest });
        }
      } catch (e) { console.error("Ошибка проверки обновления:", e); }
    };
    checkUpdates();
    trackEvent("app_started");
  }, []);

  const handleSearch = async (isNextPage = false) => {
    if (!searchQuery.trim()) return;
    
    const targetPage = isNextPage ? currentPage + 1 : 0;
    
    if (isNextPage) setIsLoadMore(true);
    else {
        setIsLoading(true);
        setVacancies([]);
        setCurrentPage(0);
    }

    setView("search");
    trackEvent(isNextPage ? "load_more_started" : "search_started", { site_filter: filterSite, page: targetPage });

    const sites = ["hh", "habr", "superjob", "zarplata"];
    let acc: Vacancy[] = isNextPage ? [...vacancies] : [];
    
    for (const s of sites) {
      try {
        // Передаем targetPage в Rust
        const res = await invoke<Vacancy[]>("search_jobs", { query: searchQuery, site: s, page: targetPage });
        acc = [...acc, ...res];
        // Если это дозагрузка, мы перемешиваем только новые или оставляем как есть? 
        // Лучше перемешать всё для честности выдачи
        setVacancies(shuffleResults(acc));
      } catch (e) { console.error(e); }
    }
    
    if (isNextPage) {
        setCurrentPage(targetPage);
        setIsLoadMore(false);
    } else {
        setIsLoading(false);
    }
  };

  const handleOpenLink = (url: string) => {
    if (!url.includes("linkedin") && !visitedVacancies.includes(url)) {
      const n = [...visitedVacancies, url];
      setVisitedVacancies(n); localStorage.setItem("jobSonar_visited", JSON.stringify(n));
      trackEvent("vacancy_opened", { url: url.split('/')[2] });
    }
    invoke("open_browser", { url });
  };

  const toggleFavorite = (v: Vacancy) => {
    const isFav = favorites.some(fav => fav.link === v.link);
    let newFavs = isFav ? favorites.filter(f => f.link !== v.link) : [...favorites, v];
    setFavorites(newFavs); invoke("save_favorites", { items: newFavs });
    trackEvent(isFav ? "favorite_removed" : "favorite_added");
  };

  const currentFilterIndex = FILTER_SITES.findIndex(s => s.id === filterSite);

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300">
      <aside className="w-64 border-r flex flex-col p-8 shrink-0 z-20 transition-all shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
        <h1 className="text-2xl font-black text-blue-600 italic tracking-tighter mb-12">Robotничкофф</h1>
        
        <nav className="space-y-4 flex-1">
          <button onClick={() => setView("search")} className={`w-full text-left px-5 py-3 rounded-2xl font-bold transition-all ${view === "search" ? 'bg-blue-600 text-white shadow-lg' : 'opacity-40'}`}>🔍 Поиск</button>
          <button onClick={() => setView("favorites")} className={`w-full text-left px-5 py-3 rounded-2xl font-bold flex items-center justify-between transition-all ${view === "favorites" ? 'bg-red-500 text-white shadow-lg' : 'opacity-40'}`}>
            <span>❤️ Избранное</span>
            {favorites.length > 0 && <span className="text-[10px] px-2 py-0.5 rounded-full bg-white text-red-500 font-black ml-2">{favorites.length}</span>}
          </button>
        </nav>
        <div className="theme-toggle-container">
          <div className="theme-toggle-switch" data-theme={theme} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            <div className="theme-toggle-pill" />
            <div className={`theme-label ${theme === 'light' ? 'active' : ''}`}>☀️ Светлая</div>
            <div className={`theme-label ${theme === 'dark' ? 'active' : ''}`}>🌙 Темная</div>
          </div>
          <div className="author-credit" onClick={() => handleOpenLink("https://www.linkedin.com/in/andreevav/")}>Автор проекта</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 transition-colors relative" style={{ backgroundColor: 'var(--bg-app)' }}>
        
        {updateInfo.show && (
          <div className="bg-blue-600 text-white px-10 py-3 flex justify-between items-center shadow-lg z-30 animate-in slide-in-from-top duration-300">
            <div className="flex items-center gap-3">
              <span className="text-lg">🚀</span>
              <span className="text-sm font-black uppercase">Доступна новая версия: v{updateInfo.version}</span>
            </div>
            <div className="flex items-center gap-6">
              <button onClick={() => {
                trackEvent("update_btn_clicked");
                handleOpenLink("https://github.com/theonestory/robotnichkoff/releases/latest");
              }} className="bg-white text-blue-600 px-6 py-1.5 rounded-xl text-xs font-black hover:scale-105 active:scale-95 transition-all shadow-md">ОБНОВИТЬ</button>
              <button onClick={() => setUpdateInfo({ ...updateInfo, show: false })} className="opacity-50 hover:opacity-100 text-xl font-bold">✕</button>
            </div>
          </div>
        )}

        <header className="border-b px-10 py-6 flex flex-col gap-5 z-10 transition-colors shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-3 max-w-4xl w-full">
            <div className="flex items-center gap-4 w-full">
                <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)} className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold outline-none transition-colors shadow-inner" style={{ backgroundColor: 'var(--input-bg)' }} placeholder="Поиск по всем сайтам..." />
                <button onClick={() => handleSearch(false)} disabled={isLoading} className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-md">{isLoading ? "..." : "НАЙТИ"}</button>
            </div>
            
            <label className="flex items-center gap-3 px-2 cursor-pointer group w-fit mt-1">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={strictMode} 
                  onChange={(e) => setStrictMode(e.target.checked)} 
                  className="sr-only peer" 
                />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all duration-200 ease-out ${strictMode ? 'bg-blue-600 border-blue-600' : 'bg-transparent'}`} style={{ borderColor: strictMode ? '' : 'var(--border)' }}>
                  <svg className={`w-3.5 h-3.5 text-white transform transition-all duration-200 ${strictMode ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <span className="text-xs font-bold tracking-wide transition-opacity duration-200 uppercase" style={{ color: 'var(--text-main)', opacity: strictMode ? 1 : 0.4 }}>
                Строгий поиск <span className="font-normal opacity-70 normal-case tracking-normal ml-1">(точное совпадение)</span>
              </span>
            </label>
          </div>
          <div className="ios-slider-container max-w-4xl">
            <div className="ios-slider-pill" style={{ left: `calc(${currentFilterIndex} * 20% + 4px)`, width: 'calc(20% - 8px)' }} />
            {FILTER_SITES.map(s => <div key={s.id} onClick={() => setFilterSite(s.id)} className="ios-slider-item" style={{ color: filterSite === s.id ? 'var(--text-main)' : 'var(--text-dim)' }}>{s.label}</div>)}
          </div>
        </header>

        {(isLoading || isLoadMore) && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none animate-in slide-in-from-bottom-8 fade-in duration-300">
            <div className="px-6 py-3.5 rounded-full flex items-center gap-4 shadow-2xl border pointer-events-auto transition-colors" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
              <div className="relative flex h-3.5 w-3.5 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-blue-600"></span>
              </div>
              <span className="text-xs font-black tracking-widest uppercase opacity-80" style={{ color: 'var(--text-main)' }}>
                {isLoadMore ? "Подгружаем еще..." : "Опрашиваем площадки..."}
              </span>
            </div>
          </div>
        )}

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar relative">
          <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10">
            {(view === "search" ? vacancies : favorites).filter(v => {
               if (filterSite !== "all") {
                 const domains: Record<string, string> = { hh: "hh.ru", habr: "habr.com", superjob: "superjob.ru", zarplata: "zarplata.ru" };
                 if (!v.link.toLowerCase().includes(domains[filterSite])) return false;
               }
               
               if (strictMode && view === "search") {
                 const title = v.title.toLowerCase();
                 const queryWords = searchQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
                 if (!queryWords.every(word => title.includes(word))) return false;
               }
               return true;
            }).map((v) => {
              const isFav = favorites.some(f => f.link === v.link);
              const isVisited = visitedVacancies.includes(v.link);
              const sL = v.salary.toLowerCase();
              const isSalaryMissing = sL.includes("не указана") || sL.includes("договоренности") || sL === "";

              return (
                <div key={v.link} className={`vacancy-card ${isVisited ? 'visited-card' : ''}`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="service-logo-container">
                      <ServiceLogo link={v.link} />
                    </div>
                    <div className="text-stack">
                      <h3 className="vacancy-title">{v.title}</h3>
                      <p className="company-name text-xs font-medium" style={{ color: 'var(--text-dim)' }}>{v.company || "Компания не указана"}</p>
                      <p className="salary-line text-xs font-bold" style={{ color: isSalaryMissing ? '#EF4444' : '#10B981' }}>
                        {isSalaryMissing ? "ЗП: не указано" : `ЗП: ${v.salary}`}
                      </p>
                    </div>
                  </div>
                  <div className="actions-area flex items-center gap-3 ml-6 shrink-0">
                    <button onClick={() => handleOpenLink(v.link)} className="round-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                    </button>
                    <button onClick={() => toggleFavorite(v)} className="round-btn">
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isFav ? "icon-fav-active" : ""}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                    </button>
                  </div>
                </div>
              );
            })}

            {/* КНОПКА ЗАГРУЗИТЬ ЕЩЕ */}
            {view === "search" && vacancies.length > 0 && !isLoading && (
                <div className="flex justify-center mt-4">
                    <button 
                        onClick={() => handleSearch(true)} 
                        disabled={isLoadMore}
                        className="text-blue-600 text-xs font-black uppercase tracking-widest hover:opacity-70 transition-all py-4 px-10"
                    >
                        {isLoadMore ? "ЗАГРУЗКА..." : "ЗАГРУЗИТЬ ЕЩЕ ВАКАНСИЙ"}
                    </button>
                </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}

function App() {
  return (
    <AptabaseProvider appKey="A-US-3662138873">
      <ApplicationContent />
    </AptabaseProvider>
  );
}

export default App;