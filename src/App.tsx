import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import "./App.css";

// Импорт твоих реальных логотипов
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

// Функция для "хаотичного" перемешивания (Алгоритм Фишера-Йетса)
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

// Компонент логотипа
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

function App() {
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [favorites, setFavorites] = useState<Vacancy[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("Менеджер");
  const [filterSite, setFilterSite] = useState("all");
  const [view, setView] = useState<"search" | "favorites">("search");
  const [visitedVacancies, setVisitedVacancies] = useState<string[]>([]);
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  useEffect(() => {
    invoke<Vacancy[]>("load_favorites").then(res => setFavorites(res));
    const savedVisited = localStorage.getItem("jobSonar_visited");
    if (savedVisited) setVisitedVacancies(JSON.parse(savedVisited));
    document.documentElement.className = theme;
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true); setView("search"); setVacancies([]);
    const sites = ["hh", "habr", "superjob", "zarplata"];
    let acc: Vacancy[] = [];
    
    for (const s of sites) {
      try {
        const res = await invoke<Vacancy[]>("search_jobs", { query: searchQuery, site: s, period: "0" });
        acc = [...acc, ...res];
        // Перемешиваем общий список для вкладки "ВСЕ"
        setVacancies(shuffleResults(acc));
      } catch (e) {}
    }
    setIsLoading(false);
  };

  const handleOpenLink = (url: string) => {
    if (!url.includes("linkedin") && !visitedVacancies.includes(url)) {
      const n = [...visitedVacancies, url];
      setVisitedVacancies(n); localStorage.setItem("jobSonar_visited", JSON.stringify(n));
    }
    invoke("open_browser", { url });
  };

  const toggleFavorite = (v: Vacancy) => {
    const isFav = favorites.some(fav => fav.link === v.link);
    let newFavs = isFav ? favorites.filter(f => f.link !== v.link) : [...favorites, v];
    setFavorites(newFavs); invoke("save_favorites", { items: newFavs });
  };

  const currentFilterIndex = FILTER_SITES.findIndex(s => s.id === filterSite);

  return (
    <div className="flex h-screen w-screen font-sans overflow-hidden transition-colors duration-300">
      <aside className="w-64 border-r flex flex-col p-8 shrink-0 z-20 transition-all shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
        {/* ЧИСТОЕ НАЗВАНИЕ БЕЗ ВЕРСИИ */}
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

      <main className="flex-1 flex flex-col overflow-hidden min-w-0 transition-colors" style={{ backgroundColor: 'var(--bg-app)' }}>
        <header className="border-b px-10 py-6 flex flex-col gap-5 z-10 transition-colors shadow-sm" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
          <div className="flex items-center gap-4 max-w-4xl w-full">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSearch()} className="flex-1 px-6 py-3.5 rounded-2xl text-sm font-bold outline-none transition-colors shadow-inner" style={{ backgroundColor: 'var(--input-bg)' }} placeholder="Поиск по всем сайтам..." />
            <button onClick={handleSearch} disabled={isLoading} className="bg-blue-600 text-white px-10 py-3.5 rounded-2xl text-sm font-black active:scale-95 transition-all shadow-md">{isLoading ? "..." : "НАЙТИ"}</button>
          </div>
          <div className="ios-slider-container max-w-4xl">
            <div className="ios-slider-pill" style={{ left: `calc(${currentFilterIndex} * 20% + 4px)`, width: 'calc(20% - 8px)' }} />
            {FILTER_SITES.map(s => <div key={s.id} onClick={() => setFilterSite(s.id)} className="ios-slider-item" style={{ color: filterSite === s.id ? 'var(--text-main)' : 'var(--text-dim)' }}>{s.label}</div>)}
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="flex flex-col gap-5 max-w-5xl mx-auto">
            {(view === "search" ? vacancies : favorites).filter(v => {
               if (filterSite === "all") return true;
               const l = v.link.toLowerCase();
               return l.includes(filterSite === "habr" ? "habr.com" : filterSite);
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
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;