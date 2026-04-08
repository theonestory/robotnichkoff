import { COMMON_DICT } from './common';
import { hhFilters } from './hh';
import { habrFilters } from './habr';
import { sjFilters } from './sj';
import { zarplataFilters } from './zarplata';

// Явно описываем структуру наших конфигураций, чтобы TypeScript понимал типы
interface SiteConfig {
  dict?: Record<string, string[]>;
  blacklist?: string[];
}

export const isJobMatch = (title: string, query: string, link: string): boolean => {
  if (!query) return true;
  
  const t = title.toLowerCase();
  const q = query.toLowerCase().trim();
  const url = link.toLowerCase();

  // 1. Подбираем конфиг по домену и явно указываем тип SiteConfig
  let siteConfig: SiteConfig = hhFilters as SiteConfig; 
  if (url.includes('habr.com')) siteConfig = habrFilters as SiteConfig;
  else if (url.includes('superjob.ru')) siteConfig = sjFilters as SiteConfig;
  else if (url.includes('zarplata.ru')) siteConfig = zarplataFilters as SiteConfig;

  // Извлекаем данные с защитой от undefined, чтобы избежать типа "never"
  const blacklist: string[] = siteConfig.blacklist || [];
  const siteDict: Record<string, string[]> = siteConfig.dict || {};

  // 2. Проверка на блэклист
  if (blacklist.some(word => t.includes(word.toLowerCase()))) {
    return false;
  }

  // 3. Склейка общей базы и словаря конкретного сайта
  const combinedDict: Record<string, string[]> = { ...COMMON_DICT, ...siteDict };

  // 4. Логика поиска по синонимам
  let matchedAliases: string[] = [q];
  for (const [key, values] of Object.entries(combinedDict)) {
    if (q.includes(key) || key.includes(q)) {
      if (Array.isArray(values)) {
        matchedAliases.push(...values);
      }
    }
  }

  const exactAliasMatch = matchedAliases.some(alias => {
    if (alias.length <= 3) {
      const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(^|[^a-zа-яё0-9_])` + escaped + `([^a-zа-яё0-9_]|$)`, 'i');
      return regex.test(t);
    }
    return t.includes(alias);
  });
  
  if (exactAliasMatch) return true;

  const queryWords = q.split(/\s+/).filter(w => w.length > 1);
  if (queryWords.length > 0 && queryWords.every(w => t.includes(w))) return true;

  return false; 
};