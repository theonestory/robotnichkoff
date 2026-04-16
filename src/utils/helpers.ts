export interface Vacancy {
  title: string; link: string; company: string; salary: string;
}

export const shuffleResults = (array: Vacancy[]) => {
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

// Безопасное получение ссылки, даже если в кэше лежат старые строковые данные
export const getSafeLink = (item: any): string => {
  if (!item) return "";
  if (typeof item === 'string') return item;
  return typeof item.link === 'string' ? item.link : "";
};

export const getBaseLink = (url: any) => {
  if (!url || typeof url !== 'string') return "";
  let base = url.split('?')[0].split('#')[0].toLowerCase().trim();
  base = base.replace(/^https?:\/\//, '').replace(/^(www\.|m\.)/, '');
  if (base.endsWith('/')) base = base.slice(0, -1);
  return base;
};

export const cleanStr = (s: any) => (typeof s === 'string' ? s : "").toLowerCase().trim();

export const isDuplicate = (a: any, b: any) => {
   if (!a || !b) return false;
   const linkA = getSafeLink(a);
   const linkB = getSafeLink(b);
   if (getBaseLink(linkA) === getBaseLink(linkB) && linkA !== "") return true;
   return cleanStr(a.title) === cleanStr(b.title) && cleanStr(a.company) === cleanStr(b.company);
};

export const fixLayoutTypo = (text: string): string => {
  if (!text) return text;
  
  const EN_TO_RU: Record<string, string> = {
    'q':'й', 'w':'ц', 'e':'у', 'r':'к', 't':'е', 'y':'н', 'u':'г', 'i':'ш', 'o':'щ', 'p':'з', '[':'х', ']':'ъ',
    'a':'ф', 's':'ы', 'd':'в', 'f':'а', 'g':'п', 'h':'р', 'j':'о', 'k':'л', 'l':'д', ';':'ж', "'":'э',
    'z':'я', 'x':'ч', 'c':'с', 'v':'м', 'b':'и', 'n':'т', 'm':'ь', ',':'б', '.':'ю', '`':'ё'
  };
  const RU_TO_EN: Record<string, string> = {};
  for (const [en, ru] of Object.entries(EN_TO_RU)) { RU_TO_EN[ru] = en; }

  const isPureEn = /^[a-zA-Z0-9\`\[\]\\;',.\s\-]+$/.test(text);
  const isPureRu = /^[а-яА-ЯёЁ0-9\s\-]+$/.test(text);

  if (isPureEn) {
    let ruTranslated = "";
    for(let i=0; i<text.length; i++) {
      const char = text[i];
      const lower = char.toLowerCase();
      const translated = EN_TO_RU[lower] || char;
      ruTranslated += char === lower ? translated : translated.toUpperCase();
    }
    const ruRoots = ['менедж', 'разработ', 'аналит', 'програм', 'дизайн', 'тестиров', 'инжен', 'администр', 'руковод', 'директ', 'специал', 'бухгалтер', 'оператор', 'ассистент', 'продукт', 'проект', 'систем', 'маркет', 'продаж', 'кадр', 'юрист', 'врач', 'учител', 'курьер', 'водител', 'стажер', 'данн', 'баз', 'сеть', 'сетев', 'безопасн', 'партн'];
    
    if (ruRoots.some(root => ruTranslated.toLowerCase().includes(root)) || /[a-zA-Z][;\[\]',][a-zA-Z]/.test(text)) {
      return ruTranslated;
    }
  }

  if (isPureRu) {
    let enTranslated = "";
    for(let i=0; i<text.length; i++) {
      const char = text[i];
      const lower = char.toLowerCase();
      const translated = RU_TO_EN[lower] || char;
      enTranslated += char === lower ? translated : translated.toUpperCase();
    }
    const enRoots = ['front', 'back', 'full', 'java', 'python', 'react', 'node', 'andr', 'ios', 'data', 'manag', 'design', 'test', 'admin', 'lead', 'head', 'chief', 'sale', 'mark', 'dev', 'ops', 'sec', 'game', 'web', 'app', 'soft', 'net', 'sql', 'php', 'ruby', 'golang', 'rust', 'c++'];
    
    if (enRoots.some(root => enTranslated.toLowerCase().includes(root))) {
      return enTranslated;
    }
  }

  return text;
};