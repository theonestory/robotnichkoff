import { useState, useEffect, useMemo, useRef } from "react";
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

function ApplicationContent() {
  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [visitedVacancies, setVisitedVacancies] = useState<Vacancy[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeSearch, setActiveSearch] = useState("");
  
  const [filterSite, setFilterSite] = useState("all");
  const [view, setView] = useState<"search" | "favorites" | "history">("search");
  const [updateInfo, setUpdateInfo] = useState<{show: boolean, version: string}>({ show: false, version: "" });

  const [allVacancies, setAllVacancies] = useState<Vacancy[]>([]);
  const [displayCount, setDisplayCount] = useState(20);
  const [nextFetchPage, setNextFetchPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingBackground, setIsFetchingBackground] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const scrollRef = useRef<HTMLElement>(null);
  const { trackEvent } = useAptabase();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [filterSite, view]);

  useEffect(() => {
    invoke<Vacancy[]>("load_favorites")
      .then(res => { if (Array.isArray(res)) setFavorites(res); })
      .catch(() => setFavorites([]));

    const savedVisited = localStorage.getItem("jobSonar_visited");
    if (savedVisited) {
      try {
        const parsed = JSON.parse(savedVisited);
        if (Array.isArray(parsed)) {
          // ИСПРАВЛЕНИЕ 1: Очищаем историю от технических ссылок при старте
          const cleaned = parsed
            .map(item => 
              typeof item === 'string' 
                ? { title: "Просмотренная вакансия", link: item, company: "", salary: "" } 
                : item
            )
            .filter(v => {
               const link = (v.link || "").toLowerCase();
               return link && !link.includes("github.com") && !link.includes("linkedin.com");
            });
            
          setVisitedVacancies(cleaned);
          localStorage.setItem("jobSonar_visited", JSON.stringify(cleaned));
        }
      } catch (e) {}
    }
    
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    const checkUpdates = async () => {
      try {
        const current = await getVersion();
        const response = await fetch('https://api.github.com/repos/theonestory/robotnichkoff/releases/latest');
        if (!response.ok) return;
        const data = await response.json();
        const latest = (data?.tag_name || "").replace('v', '');
        if (latest && latest !== current) setUpdateInfo({ show: true, version: latest });
      } catch (e) {}
    };
    checkUpdates();
  }, []);

  const handleSearch = async () => {
    const query = (searchQuery || "").trim();
    if (!query || isLoading || isFetchingBackground) return;
    
    setActiveSearch(query); 
    setHasSearched(true); 
    setIsLoading(true);
    setView("search");
    setFilterSite("all");
    setAllVacancies([]);
    setDisplayCount(20);
    setNextFetchPage(1);
    
    trackEvent("search_v1_1", { query });

    const sites = ["hh", "habr", "superjob", "zarplata"];
    let initialAcc: Vacancy[] = [];

    for (const s of sites) {
      try {
        const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: 0 });
        if (Array.isArray(res)) {
            initialAcc = [...initialAcc, ...res];
            setAllVacancies(shuffleResults([...initialAcc])); 
        }
      } catch (e) { console.error(`Ошибка загрузки ${s}:`, e); }
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
                const res = await invoke<Vacancy[]>("search_jobs", { query, site: s, page: p });
                if (Array.isArray(res)) {
                    pageItems = [...pageItems, ...res];
                }
            } catch (e) {}
        }
        
        if (pageItems.length > 0) {
            setAllVacancies(prev => [...prev, ...shuffleResults(pageItems)]);
        }
        setNextFetchPage(p + 1);
      }
    } catch (e) {} finally {
      setIsFetchingBackground(false);
    }
  };

  const handleShowMore = () => {
    const next = displayCount + 20;
    setDisplayCount(next);
    if (view === "search" && allVacancies.length - next < 30 && !isFetchingBackground) {
      backgroundFetch(activeSearch, nextFetchPage, 3);
    }
  };

  const handleOpenLink = (v: Vacancy) => {
    if (!v || !v.link) return;
    
    // ИСПРАВЛЕНИЕ 2: Блокируем запись служебных ссылок в историю
    const isServiceLink = v.link.toLowerCase().includes("github.com") || v.link.toLowerCase().includes("linkedin.com");

    if (!isServiceLink) {
      setVisitedVacancies(prev => {
        const exists = prev.some(item => item.link === v.link);
        if (exists) return prev;
        const next = [v, ...prev];
        localStorage.setItem("jobSonar_visited", JSON.stringify(next));
        return next;
      });
    }
    invoke("open_browser", { url: v.link });
  };

  const toggleFavorite = (v: Vacancy) => {
    if (!v || !v.link) return;
    const isFav = favorites.some(f => f?.link === v.link);
    let newFavs = isFav ? favorites.filter(f => f?.link !== v.link) : [...favorites, v];
    setFavorites(newFavs); invoke("save_favorites", { items: newFavs });
  };

  const filteredList = useMemo(() => {
    const rawList = view === "search" ? allVacancies : view === "favorites" ? favorites : visitedVacancies;
    if (!Array.isArray(rawList)) return [];

    const queryWords = (activeSearch || "").toLowerCase().split(/\s+/).filter(w => w.length > 2);
    
    return rawList.filter(v => {
      if (!v) return false;
      const link = (v.link || "").toLowerCase();
      
      if (filterSite !== "all") {
        const domains: Record<string, string> = { hh: "hh.ru", habr: "habr.com", superjob: "superjob.ru", zarplata: "zarplata.ru" };
        const reqDomain = domains[filterSite];
        if (reqDomain && !link.includes(reqDomain)) return false;
      }
      
      if (view === "search" && queryWords.length > 0) {
        const title = (v.title || "").toLowerCase();
        if (!queryWords.every(word => title.includes(word))) return false;
      }
      
      return true;
    });
  }, [allVacancies, favorites, visitedVacancies, filterSite, view, activeSearch]);

  const displayedList = filteredList.slice(0, displayCount);
  const currentFilterIndex = FILTER_SITES.findIndex(s => s.id === filterSite);

  const getEmptyStateText = () => {
    if (view === "favorites") return "Нет избранных вакансий";
    if (view === "history") return "История просмотров пуста";
    return "Ничего не найдено";
  };

  const isEmptyState = (view === "search" && hasSearched && filteredList.length === 0) || 
                       (view !== "search" && filteredList.length === 0);

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300">
      <aside className="w-64 border-r flex flex-col p-6 shrink-0 z-20 transition-all shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
        <h1 
          className="text-2xl font-black italic tracking-tighter mb-10 px-2 transition-colors" 
          style={{ color: theme === 'light' ? '#3F3F46' : '#FFFFFF' }}
        >
          Robotничкофф
        </h1>
        
        <nav className="space-y-3 flex-1">
          <button 
            onClick={() => { setView("search"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-all ${view === "search" ? 'bg-[#3F3F46] text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            🔍 Поиск
          </button>
          
          <button 
            onClick={() => { setView("favorites"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all ${view === "favorites" ? 'bg-red-500 text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <span>❤️ Избранное</span>
            {favorites.length > 0 && <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-2 ${view === "favorites" ? "bg-white text-red-500" : "bg-red-500 text-white"}`}>{favorites.length}</span>}
          </button>

          <button 
            onClick={() => { setView("history"); setFilterSite("all"); }} 
            className={`w-full text-left px-4 py-3 rounded-2xl text-sm font-semibold flex items-center justify-between transition-all ${view === "history" ? 'bg-[#3F3F46] text-white shadow-lg' : 'opacity-60 hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/5'}`}
          >
            <span>🕒 Вы смотрели</span>
            {visitedVacancies.length > 0 && (
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-2 transition-colors ${view === "history" ? "bg-white text-[#3F3F46]" : "bg-[#3F3F46] text-white"}`}>
                {visitedVacancies.length}
              </span>
            )}
          </button>
        </nav>
        
        <div className="theme-toggle-container pt-4">
          <div className="theme-toggle-switch" data-theme={theme} onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
            <div className="theme-toggle-pill" />
            <div className={`theme-label ${theme === 'light' ? 'active' : ''}`}>☀️ Светлая</div>
            <div className={`theme-label ${theme === 'dark' ? 'active' : ''}`}>🌙 Темная</div>
          </div>
          <div className="author-credit" onClick={() => handleOpenLink({ title: "Author", link: "https://www.linkedin.com/in/andreevav/", company: "", salary: "" })}>Автор проекта</div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 transition-colors relative" style={{ backgroundColor: 'var(--bg-app)' }}>
        {updateInfo.show && (
          <div className="bg-[#3F3F46] text-white px-10 py-3 flex justify-between items-center shadow-lg z-30">
            <span className="text-sm font-black uppercase">🚀 Доступна версия v{updateInfo.version}</span>
            <button onClick={() => handleOpenLink({ title: "Update", link: "https://github.com/theonestory/robotnichkoff/releases/latest", company: "", salary: "" })} className="bg-white text-[#3F3F46] px-6 py-1.5 rounded-xl text-xs font-black shadow-md">ОБНОВИТЬ</button>
          </div>
        )}
        <header className="border-b px-10 py-6 z-10 shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
          <div className="flex flex-col gap-4 max-w-4xl w-full">
            <div className="flex items-center gap-4 w-full">
              
              <div className="relative flex-1 flex items-center">
                <input 
                  type="text" 
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                  className="w-full px-6 py-3.5 pr-12 rounded-2xl text-sm font-bold outline-none transition-colors shadow-inner" 
                  style={{ backgroundColor: 'var(--input-bg)' }} 
                  placeholder="Название вакансии или должности" 
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery("")} 
                    className="absolute right-4 p-1.5 rounded-full opacity-40 hover:opacity-100 hover:bg-black/5 dark:hover:bg-white/10 transition-all outline-none"
                    style={{ color: 'var(--text-main)' }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                  </button>
                )}
              </div>

              <button 
                onClick={handleSearch} 
                disabled={isLoading || isFetchingBackground || !searchQuery.trim()} 
                className="w-[48px] h-[48px] shrink-0 bg-[#3F3F46] text-white rounded-2xl flex items-center justify-center active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:active:scale-100"
              >
                {isLoading ? (
                   <span className="relative flex h-4 w-4">
                     <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span>
                     <span className="relative inline-flex rounded-full h-4 w-4 bg-[#3F3F46] border-2 border-white"></span>
                   </span>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                )}
              </button>

            </div>
            <div className="ios-slider-container max-w-4xl mt-2">
              <div className="ios-slider-pill" style={{ left: `calc(${currentFilterIndex} * 20% + 4px)`, width: 'calc(20% - 8px)' }} />
              {FILTER_SITES.map(s => <div key={s.id} onClick={() => setFilterSite(s.id)} className="ios-slider-item" style={{ color: filterSite === s.id ? 'var(--text-main)' : 'var(--text-dim)' }}>{s.label}</div>)}
            </div>
          </div>
        </header>

        {(isLoading || isFetchingBackground) && (
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="px-6 py-3.5 rounded-full flex items-center gap-4 shadow-2xl border pointer-events-auto transition-colors" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
              <span className="relative flex h-3 w-3"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#3F3F46] opacity-50"></span><span className="relative inline-flex rounded-full h-3 w-3 bg-[#3F3F46]"></span></span>
              <span className="text-xs font-black tracking-widest uppercase" style={{ color: 'var(--text-main)' }}>{isLoading ? "Опрашиваем площадки..." : "Фоновая подгрузка..."}</span>
            </div>
          </div>
        )}

        {isEmptyState && !isLoading && !isFetchingBackground && (
          <section className="flex-1 flex items-center justify-center opacity-20">
            <p className="text-[12px] font-black uppercase tracking-[0.2em] text-center">{getEmptyStateText()}</p>
          </section>
        )}

        {!isEmptyState && (
          <section ref={scrollRef} className="flex-1 overflow-y-auto p-8 custom-scrollbar relative scroll-smooth">
            <div className="flex flex-col gap-5 max-w-5xl mx-auto pb-10">
              {displayedList.map((v, index) => {
                const safeKey = `${v?.link || index}-${index}`;
                const isFav = favorites.some(f => f?.link === v?.link);
                const isVisitedInSearch = visitedVacancies.some(historyItem => historyItem?.link === v?.link);
                const shouldMute = isVisitedInSearch && view !== "history";

                const sL = (v?.salary || "").toLowerCase();
                const isSalaryMissing = sL.includes("не указана") || sL.includes("договоренности") || sL === "";

                return (
                  <div 
                    key={safeKey} 
                    onClick={() => handleOpenLink(v)} 
                    className={`vacancy-card cursor-pointer transition-transform active:scale-[0.99] group ${shouldMute ? 'visited-card' : ''}`}
                  >
                    <div className="flex items-center flex-1 min-w-0">
                      <div className="service-logo-container">
                        <ServiceLogo link={v?.link || ""} />
                      </div>
                      <div className="text-stack flex-1 min-w-0">
                        <h3 className="vacancy-title truncate" title={v?.title || "Без названия"}>{v?.title || "Без названия"}</h3>
                        <p className="company-name text-xs font-medium mt-1 truncate" style={{ color: 'var(--text-dim)' }} title={v?.company || "Компания не указана"}>{v?.company || "Компания не указана"}</p>
                        <p className="salary-line text-xs font-bold mt-1 truncate" style={{ color: isSalaryMissing ? '#EF4444' : '#10B981' }}>{isSalaryMissing ? "ЗП: не указано" : `ЗП: ${v?.salary || ""}`}</p>
                      </div>
                    </div>
                    <div className="actions-area flex items-center gap-3 ml-6 shrink-0">
                      <button 
                        onClick={(e) => { 
                          e.preventDefault();
                          e.stopPropagation(); 
                          toggleFavorite(v); 
                        }} 
                        className="round-btn relative z-10"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isFav ? "icon-fav-active text-red-500" : ""}><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredList.length > displayCount && !isLoading && (
                  <div className="flex justify-center mt-8 pb-12">
                      <button 
                        onClick={handleShowMore} 
                        className="text-[10px] font-black uppercase tracking-[0.2em] transition-all opacity-60 hover:opacity-100 active:scale-95 outline-none"
                        style={{ color: 'var(--text-dim)' }}
                      >
                        Показать еще
                      </button>
                  </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function App() { return ( <AptabaseProvider appKey="A-US-3662138873"><ApplicationContent /></AptabaseProvider> ); }
export default App;