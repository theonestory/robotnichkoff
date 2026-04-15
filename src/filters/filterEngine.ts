import { COMMON_DICT } from './common';
import { hhFilters } from './hh';
import { habrFilters } from './habr';
import { sjFilters } from './sj';
import { zarplataFilters } from './zarplata';
import { geekjobFilters } from './geekjob'; // Добавили импорт

interface SiteConfig {
  dict?: Record<string, string[]>;
  blacklist?: string[];
}

export const isJobMatch = (title: string, query: string, link: string): boolean => {
  if (!query) return true;
  
  const t = title.toLowerCase();
  const q = query.toLowerCase().trim();
  const url = link.toLowerCase();

  let siteConfig: SiteConfig = hhFilters as SiteConfig; 
  if (url.includes('habr.com')) siteConfig = habrFilters as SiteConfig;
  else if (url.includes('superjob.ru')) siteConfig = sjFilters as SiteConfig;
  else if (url.includes('zarplata.ru')) siteConfig = zarplataFilters as SiteConfig;
  else if (url.includes('geekjob.ru')) siteConfig = geekjobFilters as SiteConfig; // Добавили проверку GeekJob

  const blacklist: string[] = siteConfig.blacklist || [];
  const siteDict: Record<string, string[]> = siteConfig.dict || {};

  if (blacklist.some(word => t.includes(word.toLowerCase()))) {
    return false;
  }

  const combinedDict: Record<string, string[]> = { ...COMMON_DICT, ...siteDict };

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