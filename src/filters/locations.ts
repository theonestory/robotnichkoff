export const COUNTRIES = [
  { id: "all", name: "Все страны" },
  { id: "ru", name: "Россия" },
  { id: "kz", name: "Казахстан" },
  { id: "by", name: "Беларусь" },
  { id: "uz", name: "Узбекистан" },
  { id: "tj", name: "Таджикистан" },
];

export const CITIES: Record<string, { id: string, name: string, hh: string, habr: string, sj: string }[]> = {
  all: [
    { id: "all_any", name: "Все города", hh: "", habr: "", sj: "" }
  ],
  ru: [
    { id: "ru_all", name: "Вся Россия", hh: "113", habr: "", sj: "russia" },
    { id: "msk", name: "Москва и МО", hh: "1&area=2019", habr: "c_678", sj: "moskva" },
    { id: "spb", name: "Санкт-Петербург и ЛО", hh: "2&area=145", habr: "c_679", sj: "spb" },
    { id: "ekb", name: "Екатеринбург и обл.", hh: "3&area=1261", habr: "c_694", sj: "ekaterinburg" },
    { id: "kazan", name: "Казань и Татарстан", hh: "88&area=1620", habr: "c_698", sj: "kazan" },
    { id: "nsk", name: "Новосибирск и обл.", hh: "4&area=1202", habr: "c_693", sj: "novosibirsk" },
    { id: "nn", name: "Нижний Новгород", hh: "66", habr: "c_685", sj: "nizhnij_novgorod" },
    { id: "krd", name: "Краснодарский край", hh: "53&area=1438", habr: "c_683", sj: "krasnodar" },
    { id: "rnd", name: "Ростов-на-Дону", hh: "76", habr: "c_718", sj: "rostov-na-donu" },
    { id: "sam", name: "Самара", hh: "78", habr: "c_720", sj: "samara" },
    { id: "ufa", name: "Уфа", hh: "99", habr: "c_733", sj: "ufa" },
    { id: "vor", name: "Воронеж", hh: "26", habr: "c_686", sj: "voronezh" },
    { id: "perm", name: "Пермь", hh: "72", habr: "c_715", sj: "perm" },
    { id: "vol", name: "Волгоград", hh: "24", habr: "c_681", sj: "volgograd" },
    { id: "kras", name: "Красноярск", hh: "54", habr: "c_699", sj: "krasnoyarsk" },
    { id: "chel", name: "Челябинск", hh: "104", habr: "c_740", sj: "chelyabinsk" },
    { id: "omsk", name: "Омск", hh: "68", habr: "c_713", sj: "omsk" },
    { id: "tomsk", name: "Томск", hh: "90", habr: "c_730", sj: "tomsk" },
    { id: "irk", name: "Иркутск", hh: "35", habr: "c_696", sj: "irkutsk" },
    { id: "vvo", name: "Владивосток", hh: "22", habr: "c_680", sj: "vladivostok" },
    { id: "khv", name: "Хабаровск", hh: "102", habr: "c_738", sj: "habarovsk" },
    { id: "tmn", name: "Тюмень", hh: "95", habr: "c_731", sj: "tumen" },
    { id: "sar", name: "Саратов", hh: "79", habr: "c_721", sj: "saratov" },
    { id: "tol", name: "Тольятти", hh: "212", habr: "c_728", sj: "tolyatti" },
    { id: "izh", name: "Ижевск", hh: "43", habr: "c_695", sj: "izhevsk" },
    { id: "brn", name: "Барнаул", hh: "11", habr: "c_682", sj: "barnaul" },
    { id: "uly", name: "Ульяновск", hh: "98", habr: "c_732", sj: "ulyanovsk" },
    { id: "yar", name: "Ярославль", hh: "112", habr: "c_743", sj: "yaroslavl" },
    { id: "makh", name: "Махачкала", hh: "61", habr: "c_707", sj: "mahachkala" },
    { id: "ryaz", name: "Рязань", hh: "77", habr: "c_719", sj: "ryazan" },
    { id: "astr", name: "Астрахань", hh: "10", habr: "c_684", sj: "astrahan" },
    { id: "kld", name: "Калининград", hh: "41", habr: "c_697", sj: "kaliningrad" }
  ],
  kz: [
    { id: "kz_all", name: "Весь Казахстан", hh: "40", habr: "", sj: "" },
    { id: "almaty", name: "Алматы", hh: "160", habr: "c_2805", sj: "almaty" },
    { id: "astana", name: "Астана", hh: "159", habr: "c_2806", sj: "astana" },
    { id: "shymkent", name: "Шымкент", hh: "164", habr: "c_2812", sj: "shimkent" },
    { id: "karaganda", name: "Караганда", hh: "161", habr: "c_2809", sj: "karaganda" },
    { id: "aktobe", name: "Актобе", hh: "201", habr: "c_2804", sj: "aktobe" },
    { id: "taraz", name: "Тараз", hh: "208", habr: "c_2810", sj: "taraz" },
    { id: "pavlodar", name: "Павлодар", hh: "205", habr: "c_2814", sj: "pavlodar" },
    { id: "oskemen", name: "Усть-Каменогорск", hh: "163", habr: "c_2813", sj: "ust-kamenogorsk" },
    { id: "semey", name: "Семей", hh: "207", habr: "c_2815", sj: "semej" },
    { id: "atyrau", name: "Атырау", hh: "202", habr: "c_2807", sj: "atirau" },
  ],
  by: [
    { id: "by_all", name: "Вся Беларусь", hh: "16", habr: "", sj: "" },
    { id: "minsk", name: "Минск", hh: "1002", habr: "c_2808", sj: "minsk" },
    { id: "gomel", name: "Гомель", hh: "1003", habr: "c_2821", sj: "gomel" },
    { id: "vitebsk", name: "Витебск", hh: "1004", habr: "c_2819", sj: "vitebsk" },
    { id: "mogilev", name: "Могилев", hh: "1005", habr: "c_2822", sj: "mogilev" },
    { id: "grodno", name: "Гродно", hh: "1006", habr: "c_2820", sj: "grodno" },
  ],
  uz: [
    { id: "uz_all", name: "Весь Узбекистан", hh: "97", habr: "", sj: "" },
    { id: "tashkent", name: "Ташкент", hh: "2759", habr: "c_3106", sj: "tashkent" },
    { id: "samarkand", name: "Самарканд", hh: "2763", habr: "c_3104", sj: "samarkand" },
    { id: "namangan", name: "Наманган", hh: "2761", habr: "c_3101", sj: "namangan" },
  ],
  tj: [
    { id: "tj_all", name: "Весь Таджикистан", hh: "2806", habr: "", sj: "" },
    { id: "dushanbe", name: "Душанбе", hh: "2807", habr: "", sj: "dushanbe" },
    { id: "khujand", name: "Худжанд", hh: "2810", habr: "", sj: "hudzhand" },
    { id: "bokhtar", name: "Бохтар", hh: "2808", habr: "", sj: "" },
  ]
};

export const WORK_FORMATS = [
  { id: "any", name: "Любой формат", hh: "", habr: "", sj: "" },
  { id: "remote", name: "Удаленная работа", hh: "&schedule=remote", habr: "&remote=1", sj: "&tjat=2" },
  { id: "office", name: "Офис", hh: "&schedule=fullDay", habr: "&remote=0", sj: "&tjat=1" },
  { id: "hybrid", name: "Гибрид", hh: "&schedule=flexible", habr: "&remote=1", sj: "&tjat=3" }
];