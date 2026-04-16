// Импортируем наши локальные SVG-логотипы (оставляем без изменений)
import hhLogo from "../assets/logos/hh.svg";
import habrLogo from "../assets/logos/habr.svg";
import sjLogo from "../assets/logos/superjob.svg";
import zarplataLogo from "../assets/logos/zarplata.svg";
import geekjobLogo from "../assets/logos/geekjob.svg"; 
import trudvsemLogo from "../assets/logos/trudvsem.svg";
import remotejobLogo from "../assets/logos/remote-job.svg";
import rabotaruLogo from "../assets/logos/rabotaru.svg";

export const FILTER_SITES = [
  { id: "all", name: "ВСЕ" },
  { id: "hh", name: "HH.RU" },
  { id: "habr", name: "HABR" },
  { id: "superjob", name: "SUPERJOB" },
  { id: "zarplata", name: "ZARPLATA" },
  { id: "geekjob", name: "GEEKJOB" },
  { id: "trudvsem", name: "ТРУДВСЕМ" },
  { id: "remotejob", name: "REMOTE-JOB" },
  { id: "rabotaru", name: "RABOTA.RU" },
];

const getLocalLogo = (id: string) => {
  switch (id) {
    case "hh": return hhLogo;
    case "habr": return habrLogo;
    case "superjob": return sjLogo;
    case "zarplata": return zarplataLogo;
    case "geekjob": return geekjobLogo;
    case "trudvsem": return trudvsemLogo;
    case "remotejob": return remotejobLogo;
    case "rabotaru": return rabotaruLogo;
    default: return "";
  }
};

interface SidebarProps {
  t: any;
  theme: string;
  setTheme: (theme: string) => void;
  filterSite: string;
  setFilterSite: (site: string) => void;
  view: string;
  setView: (view: "search" | "favorites" | "history" | "deleted") => void;
  activeLang: string;
  invoke: any; 
}

export default function Sidebar({ t, theme, setTheme, filterSite, setFilterSite, view, setView, activeLang, invoke }: SidebarProps) {
  return (
    <aside className="w-72 flex flex-col border-r transition-colors duration-300 z-20 shrink-0" style={{ backgroundColor: 'var(--bg-side)', borderColor: 'var(--border)' }}>
      <div className="p-8">
        <h1 className="text-2xl font-black italic tracking-tighter mb-8" style={{ color: 'var(--text-main)' }}>Robotничкофф</h1>
        
        <nav className="space-y-6">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-40" style={{ color: 'var(--text-main)' }}>{activeLang === 'en' ? 'RESOURCES' : 'РЕСУРСЫ'}</p>
            <div className="space-y-1">
              {FILTER_SITES.map((s) => (
                <button 
                  key={s.id} 
                  onClick={() => { setView("search"); setFilterSite(s.id); }} 
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all outline-none flex items-center justify-between ${filterSite === s.id && view === "search" ? 'bg-[#3F3F46] text-white shadow-md' : 'text-[var(--text-dim)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-3">
                    {s.id === 'all' ? (
                      // ИСПРАВЛЕНО: Теперь здесь SVG в виде слоев (Layers)
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-60"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
                    ) : (
                      // SVG-логотипы без лишних скруглений
                      <div className="w-[18px] h-[18px] flex items-center justify-center shrink-0">
                        <img src={getLocalLogo(s.id)} alt={s.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <span>{s.name}</span>
                  </div>
                  {filterSite === s.id && view === "search" && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]"></div>}
                </button>
              ))}
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-6 flex flex-col items-center gap-6">
        <div 
          className="theme-toggle-switch w-full" 
          data-theme={theme} 
          onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
        >
          <div className="theme-toggle-pill" />
          <div className={`theme-label ${theme === 'light' ? 'active' : ''}`}>
            {t.theme_light}
          </div>
          <div className={`theme-label ${theme === 'dark' ? 'active' : ''}`}>
            {t.theme_dark}
          </div>
        </div>
        
        <button 
          onClick={() => invoke("open_browser", { url: "https://www.linkedin.com/in/andreevav/" })}
          className="w-full text-[10px] font-black uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity outline-none" 
          style={{ color: 'var(--text-main)' }}
        >
          {t.contact || (activeLang === 'ru' ? 'СВЯЗАТЬСЯ С АВТОРОМ' : 'CONTACT AUTHOR')}
        </button>
      </div>
    </aside>
  );
}