import React from "react";

interface HeaderProps {
  t: any;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  isLoading: boolean;
  isFetchingBackground: boolean;
  isSearchCompleted: boolean;
  onClearSearch: () => void;
  handleSearch: () => void;
  handleOpenSettings: () => void;
  isFilterActiveGlobally: boolean;
  view: string;
  setView: (view: "search" | "favorites" | "history" | "deleted") => void;
  activeLang: string;
}

export default function Header({ 
  t, searchQuery, setSearchQuery, handleKeyDown, isLoading, isFetchingBackground, 
  isSearchCompleted, onClearSearch, handleSearch, handleOpenSettings, 
  isFilterActiveGlobally, view, setView, activeLang 
}: HeaderProps) {
  
  const tabs = [
    { id: 'search', label: activeLang === 'ru' ? 'Поиск' : 'Search', emoji: '🔍' },
    { id: 'favorites', label: activeLang === 'ru' ? 'Избранное' : 'Favorites', emoji: '❤️' },
    { id: 'history', label: activeLang === 'ru' ? 'История' : 'History', emoji: '🕒' },
    { id: 'deleted', label: activeLang === 'ru' ? 'Удаленное' : 'Deleted', emoji: '🗑️' }
  ];

  const activeTabIndex = tabs.findIndex(t => t.id === view);

  return (
    <header className="px-8 pt-8 pb-4 shrink-0 transition-colors duration-300 relative z-30" style={{ backgroundColor: 'var(--bg-side)' }}>
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <div className="flex-1 relative group">
            <input 
              type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={t.search_placeholder || "Название вакансии или должности"}
              /* ИСПРАВЛЕНО: pl-6 (текст слева), pr-14 (отступ для иконок справа) */
              className="w-full h-14 pl-6 pr-14 rounded-[1.25rem] border-2 text-sm font-medium transition-all outline-none focus:border-emerald-500/50"
              style={{ backgroundColor: 'var(--input-bg)', borderColor: 'var(--border)', color: 'var(--text-main)' }}
            />
            
            {/* ИСПРАВЛЕНО: Умный блок справа, который меняет свои состояния */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center w-7 h-7">
              {isLoading || isFetchingBackground ? (
                /* Состояние 1: Идет загрузка -> Пульсирующая точка */
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
              ) : isSearchCompleted ? (
                /* Состояние 2: Поиск завершен -> Крестик (очистить) */
                <div 
                  onClick={onClearSearch} 
                  className="w-full h-full flex items-center justify-center rounded-full cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 hover:!text-[var(--text-main)] transition-colors"
                  style={{ color: 'var(--text-dim)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </div>
              ) : (
                /* Состояние 3: Пустое поле или набор текста -> Лупа (запустить поиск) */
                <div 
                  onClick={() => { if (searchQuery.trim()) handleSearch(); }}
                  className="w-full h-full flex items-center justify-center rounded-full cursor-pointer hover:text-emerald-500 transition-colors group-focus-within:!text-emerald-500"
                  style={{ color: 'var(--text-dim)' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              )}
            </div>
          </div>
          
          <div 
            onClick={handleOpenSettings}
            className={`h-14 w-14 flex items-center justify-center rounded-[1.25rem] border-2 transition-transform cursor-pointer hover:scale-105 active:scale-95 relative hover:!text-[var(--text-main)] ${isFilterActiveGlobally ? 'border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-500 hover:!text-emerald-500' : 'border-[var(--border)] bg-[var(--input-bg)]'}`}
            style={{ color: isFilterActiveGlobally ? '' : 'var(--text-dim)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
            {isFilterActiveGlobally && <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-[var(--bg-app)]"></div>}
          </div>
        </div>

        <div className="ios-slider-container w-full">
          <div 
            className="ios-slider-pill" 
            style={{ 
              width: 'calc(25% - 2px)', 
              left: `calc(${activeTabIndex * 25}% + ${4 - activeTabIndex * 2}px)` 
            }} 
          />
          {tabs.map((item) => (
            <div 
              key={item.id} 
              onClick={() => setView(item.id as any)} 
              className={`ios-slider-item flex items-center justify-center gap-2 transition-colors duration-300 cursor-pointer ${view === item.id ? 'text-[var(--toggle-text-active)]' : 'text-[var(--text-dim)] hover:text-[var(--text-main)]'}`}
            >
              <span className="text-sm">{item.emoji}</span> <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </header>
  );
}