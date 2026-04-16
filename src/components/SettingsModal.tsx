import { useState } from "react";

interface SettingsModalProps {
  isOpen: boolean;
  setIsFiltersOpen: (open: boolean) => void;
  t: any;
  draftCountry: string;
  setDraftCountry: (id: string) => void;
  draftCity: string;
  setDraftCity: (id: string) => void;
  draftFormat: string;
  setDraftFormat: (id: string) => void;
  draftSalary: string;
  setDraftSalary: (id: string) => void;
  draftLang: string;
  setDraftLang: (id: string) => void;
  localizedCountries: any[];
  localizedCities: any[];
  localizedWorkFormats: any[];
  getSalaryFilters: any[];
  LANG_FILTERS: any[];
  handleSaveFilters: () => void;
  isSavingFilters: boolean;
  isSavedSuccess: boolean;
  hasDraftChanges: boolean;
  appVersion: string;
  invoke: any;
}

export default function SettingsModal({
  isOpen, setIsFiltersOpen, t, 
  draftCountry, setDraftCountry, draftCity, setDraftCity, draftFormat, setDraftFormat, 
  draftSalary, setDraftSalary, draftLang, setDraftLang,
  localizedCountries, localizedCities, localizedWorkFormats, getSalaryFilters, LANG_FILTERS,
  handleSaveFilters, isSavingFilters, isSavedSuccess, hasDraftChanges, appVersion, invoke
}: SettingsModalProps) {
  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center transition-opacity duration-300 ease-in-out ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`} style={{ backgroundColor: 'var(--bg-app)' }}>
      <button onClick={() => setIsFiltersOpen(false)} className="absolute top-8 right-10 p-3 rounded-2xl opacity-40 hover:opacity-100 transition-all hover:scale-105 active:scale-95 outline-none" style={{ backgroundColor: 'var(--bg-side)', color: 'var(--text-main)' }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
      </button>

      <div className="flex flex-col items-center w-full max-w-sm gap-8 px-6">
        {/* ИСПРАВЛЕНО: Возвращаем перевод заголовка */}
        <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text-main)' }}>{t.settings_title}</h2>
        
        <div className="w-full flex flex-col gap-5">
          {/* ИСПРАВЛЕНО: Билингвальный тултип */}
          <div className="opacity-40 pointer-events-none grayscale flex flex-col gap-5 w-full" title={t.settings_title === "Settings" ? "Geo-filters are temporarily disabled" : "Гео-фильтры временно отключены"}>
            <CustomSelect label={t.filter_country} options={localizedCountries} selectedId={draftCountry} onSelect={setDraftCountry} placeholder={t.select_placeholder} />
            <CustomSelect label={t.filter_city} options={localizedCities} selectedId={draftCity} onSelect={setDraftCity} placeholder={t.select_placeholder} />
          </div>

          <CustomSelect label={t.filter_format} options={localizedWorkFormats} selectedId={draftFormat} onSelect={setDraftFormat} placeholder={t.select_placeholder} />
          <CustomSelect label={t.filter_salary} options={getSalaryFilters} selectedId={draftSalary} onSelect={setDraftSalary} placeholder={t.select_placeholder} />
          <CustomSelect label={t.filter_lang} options={LANG_FILTERS} selectedId={draftLang} onSelect={setDraftLang} placeholder={t.select_placeholder} />
        </div>

        <button 
          onClick={handleSaveFilters}
          disabled={!hasDraftChanges || isSavingFilters || isSavedSuccess}
          className={`mt-4 w-full py-4 rounded-2xl text-sm font-black tracking-wide uppercase transition-all duration-300 flex items-center justify-center gap-2 ${hasDraftChanges || isSavedSuccess ? "shadow-xl active:scale-95 opacity-100 cursor-pointer" : "opacity-40 cursor-not-allowed"}`}
          style={{ backgroundColor: isSavedSuccess ? '#10B981' : 'var(--text-main)', color: 'var(--bg-app)', transform: isSavedSuccess ? 'scale(1.02)' : 'scale(1)' }}
        >
          {isSavingFilters ? <span className="relative flex h-5 w-5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-50"></span><span className="relative inline-flex rounded-full h-5 w-5 bg-white"></span></span> : isSavedSuccess ? <><svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>{t.btn_applied}</> : t.btn_apply}
        </button>
      </div>

      <div className="absolute bottom-8 right-10 flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] opacity-30 hover:opacity-100 transition-opacity" style={{ color: 'var(--text-main)' }}>
        <button onClick={() => invoke("open_browser", { url: "https://github.com/theonestory/robotnichkoff" })} className="hover:underline outline-none transition-colors">GitHub</button>
        <span style={{ color: 'var(--text-dim)' }}>|</span>
        <span>{t.version} {appVersion}</span>
      </div>
    </div>
  );
}

function CustomSelect({ label, options, selectedId, onSelect, placeholder }: { label: string, options: any[], selectedId: string, onSelect: (id: string) => void, placeholder: string }) {
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
}