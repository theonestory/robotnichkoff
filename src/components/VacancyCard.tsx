import React from "react";

interface Vacancy {
  title: string; link: string; company: string; salary: string;
}

interface VacancyCardProps {
  v: Vacancy;
  // Удалили index: number;
  t: any;
  isFav: boolean;
  shouldMute: boolean;
  isSalaryMissing: boolean;
  handleOpenLink: (v: Vacancy) => void;
  toggleFavorite: (v: Vacancy) => void;
  handleDelete: (v: Vacancy) => void;
  isDeleting: boolean;
  view: string;
  restoreDeleted: (v: Vacancy) => void;
  ServiceLogo: React.ComponentType<{ link: string }>;
}

export default function VacancyCard({ 
  v, t, isFav, shouldMute, isSalaryMissing, handleOpenLink, toggleFavorite, 
  handleDelete, isDeleting, view, restoreDeleted, ServiceLogo 
}: VacancyCardProps) {
  return (
    <div 
      onClick={() => handleOpenLink(v)} 
      className={`vacancy-card cursor-pointer group ${shouldMute ? 'visited-card' : ''} ${isDeleting ? 'opacity-0 scale-95 pointer-events-none' : ''}`}
    >
      <div className="flex items-center flex-1 min-w-0 pr-4">
        <div className="service-logo-container">
          <ServiceLogo link={v?.link || ""} />
        </div>
        <div className="text-stack flex-1 min-w-0">
          <h3 className="vacancy-title truncate transition-colors">{v?.title || t.no_title}</h3>
          <p className="company-name text-xs font-medium mt-1 truncate transition-colors" style={{ color: 'var(--text-dim)' }}>
            {v?.company || t.no_company}
          </p>
          <p className="salary-line text-xs font-bold mt-1 truncate transition-colors" style={{ color: isSalaryMissing ? '#EF4444' : '#10B981' }}>
            {isSalaryMissing ? t.salary_missing : `${t.salary_prefix}${v?.salary || ""}`}
          </p>
        </div>
      </div>
      <div className="actions-area flex items-center gap-2 shrink-0">
        {view === "deleted" ? (
          <button 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); restoreDeleted(v); }} 
            className="round-btn relative z-10 hover:text-emerald-500"
          >
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
          </button>
        ) : (
          <>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(v); }} 
              className="round-btn relative z-10 hover:text-red-500"
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" 
                fill={isFav ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2.5" 
                strokeLinecap="round" strokeLinejoin="round" className={isFav ? "icon-fav-active text-red-500" : ""}
              >
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
              </svg>
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDelete(v); }} 
              className="round-btn relative z-10 hover:!text-slate-500 dark:hover:!text-slate-400"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
}