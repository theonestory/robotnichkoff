export const WORK_FORMATS = [
  { id: "any", name: "Любой формат", hh: "", habr: "", sj: "" },
  { id: "remote", name: "Удаленная работа", hh: "&schedule=remote", habr: "&remote=true", sj: "&remote=1" },
  { id: "office", name: "Офис / Гибрид", hh: "&schedule=fullDay", habr: "&remote=false", sj: "&place_of_work=1" }
];

export const COUNTRIES = [
  { id: "all", name: "Везде" },
  { id: "russia", name: "Россия" },
  { id: "ru_cis", name: "Россия и СНГ" },
  { id: "cis", name: "СНГ" },
  { id: "europe_all", name: "Европа" },
  { id: "usa", name: "США" },
  { id: "belarus", name: "Беларусь" },
  { id: "kazakhstan", name: "Казахстан" },
  { id: "armenia", name: "Армения" },
  { id: "georgia", name: "Грузия" },
  { id: "azerbaijan", name: "Азербайджан" },
  { id: "kyrgyzstan", name: "Кыргызстан" },
  { id: "moldova", name: "Молдова" },
  { id: "tajikistan", name: "Таджикистан" },
  { id: "turkmenistan", name: "Туркменистан" },
  { id: "uzbekistan", name: "Узбекистан" },
  { id: "germany", name: "Германия" },
  { id: "uk", name: "Великобритания" },
  { id: "poland", name: "Польша" },
  { id: "cyprus", name: "Кипр" },
  { id: "serbia", name: "Сербия" },
  { id: "nl", name: "Нидерланды" },
  { id: "france", name: "Франция" },
  { id: "spain", name: "Испания" }
];

export const CITIES: Record<string, { id: string; name: string; hh: string; habr: string; sj: string }[]> = {
  "all": [
    { id: "all_any", name: "Все локации", hh: "113&area=16&area=40&area=9&area=8&area=28&area=48&area=65&area=83&area=89&area=97&area=37&area=84", habr: "", sj: "" }
  ],
  "ru_cis": [
    { id: "ru_cis_any", name: "Вся Россия и СНГ", hh: "113&area=16&area=40&area=9&area=28&area=8&area=48&area=65&area=83&area=89&area=97", habr: "", sj: "" }
  ],
  "cis": [
    { id: "cis_any", name: "Все страны СНГ (без РФ)", hh: "16&area=40&area=9&area=28&area=8&area=48&area=65&area=83&area=89&area=97", habr: "", sj: "" }
  ],
  "europe_all": [
    { id: "eu_all", name: "Все страны Европы", hh: "37", habr: "c_50", sj: "" },
    { id: "eu_germany", name: "Германия", hh: "26", habr: "", sj: "" },
    { id: "eu_uk", name: "Великобритания", hh: "43", habr: "", sj: "" },
    { id: "eu_france", name: "Франция", hh: "39", habr: "", sj: "" },
    { id: "eu_poland", name: "Польша", hh: "75", habr: "", sj: "" },
    { id: "eu_cyprus", name: "Кипр", hh: "102", habr: "", sj: "" },
    { id: "eu_serbia", name: "Сербия", hh: "80", habr: "", sj: "" },
    { id: "eu_spain", name: "Испания", hh: "41", habr: "", sj: "" },
    { id: "eu_italy", name: "Италия", hh: "36", habr: "", sj: "" },
    { id: "eu_nl", name: "Нидерланды", hh: "68", habr: "", sj: "" },
  ],
  "usa": [
    { id: "us_all", name: "Все США", hh: "84", habr: "c_6", sj: "" },
    { id: "us_ny", name: "Нью-Йорк", hh: "84", habr: "", sj: "" },
    { id: "us_sf", name: "Сан-Франциско", hh: "84", habr: "", sj: "" },
    { id: "us_la", name: "Лос-Анджелес", hh: "84", habr: "", sj: "" },
    { id: "us_seattle", name: "Сиэтл", hh: "84", habr: "", sj: "" },
    { id: "us_chicago", name: "Чикаго", hh: "84", habr: "", sj: "" }
  ],
  "russia": [
    { id: "ru_all", name: "Вся Россия", hh: "113", habr: "c_1", sj: "c_1" },
    { id: "ru_msk", name: "Москва", hh: "1", habr: "c_678", sj: "t_4" },
    { id: "ru_spb", name: "Санкт-Петербург", hh: "2", habr: "c_679", sj: "t_14" },
    { id: "ru_nsk", name: "Новосибирск", hh: "4", habr: "c_705", sj: "t_11" },
    { id: "ru_ekb", name: "Екатеринбург", hh: "3", habr: "c_693", sj: "t_33" },
    { id: "ru_kzn", name: "Казань", hh: "88", habr: "c_696", sj: "t_123" },
    { id: "ru_nn", name: "Нижний Новгород", hh: "66", habr: "c_703", sj: "t_63" },
    { id: "ru_chelyabinsk", name: "Челябинск", hh: "104", habr: "c_726", sj: "t_97" },
    { id: "ru_samara", name: "Самара", hh: "78", habr: "c_712", sj: "t_200" },
    { id: "ru_ufa", name: "Уфа", hh: "99", habr: "c_723", sj: "t_216" },
    { id: "ru_rostov", name: "Ростов-на-Дону", hh: "76", habr: "c_710", sj: "t_85" },
    { id: "ru_krasnodar", name: "Краснодар", hh: "53", habr: "c_698", sj: "t_130" },
    { id: "ru_voronezh", name: "Воронеж", hh: "26", habr: "c_690", sj: "t_25" },
    { id: "ru_perm", name: "Пермь", hh: "72", habr: "c_707", sj: "t_71" },
    { id: "ru_volgograd", name: "Волгоград", hh: "24", habr: "c_688", sj: "t_23" },
    { id: "ru_krasnoyarsk", name: "Красноярск", hh: "54", habr: "c_699", sj: "t_48" },
    { id: "ru_omsk", name: "Омск", hh: "68", habr: "c_706", sj: "t_66" },
    { id: "ru_kaliningrad", name: "Калининград", hh: "41", habr: "c_694", sj: "t_40" },
    { id: "ru_vladivostok", name: "Владивосток", hh: "22", habr: "c_686", sj: "t_21" },
    { id: "ru_tomsk", name: "Томск", hh: "90", habr: "c_717", sj: "t_88" },
    { id: "ru_tyumen", name: "Тюмень", hh: "95", habr: "c_720", sj: "t_90" },
    { id: "ru_saratov", name: "Саратов", hh: "79", habr: "c_713", sj: "t_82" }
  ],
  "belarus": [
    { id: "by_all", name: "Вся Беларусь", hh: "16", habr: "c_3", sj: "c_3" },
    { id: "by_minsk", name: "Минск", hh: "1002", habr: "c_731", sj: "t_1811" },
    { id: "by_gomel", name: "Гомель", hh: "1003", habr: "", sj: "" },
    { id: "by_vitebsk", name: "Витебск", hh: "1005", habr: "", sj: "" },
    { id: "by_mogilev", name: "Могилев", hh: "1007", habr: "", sj: "" },
    { id: "by_grodno", name: "Гродно", hh: "1006", habr: "", sj: "" },
    { id: "by_brest", name: "Брест", hh: "1004", habr: "", sj: "" },
  ],
  "kazakhstan": [
    { id: "kz_all", name: "Весь Казахстан", hh: "40", habr: "c_9", sj: "c_8" },
    { id: "kz_almaty", name: "Алматы", hh: "160", habr: "c_733", sj: "" },
    { id: "kz_astana", name: "Астана", hh: "159", habr: "", sj: "" },
    { id: "kz_shymkent", name: "Шымкент", hh: "164", habr: "", sj: "" },
    { id: "kz_karaganda", name: "Караганда", hh: "161", habr: "", sj: "" },
  ],
  "armenia": [
    { id: "am_all", name: "Вся Армения", hh: "9", habr: "c_16", sj: "c_14" },
    { id: "am_yerevan", name: "Ереван", hh: "2088", habr: "", sj: "" },
    { id: "am_gyumri", name: "Гюмри", hh: "9", habr: "", sj: "" },
  ],
  "georgia": [
    { id: "ge_all", name: "Вся Грузия", hh: "28", habr: "c_22", sj: "c_18" },
    { id: "ge_tbilisi", name: "Тбилиси", hh: "2788", habr: "c_737", sj: "" },
    { id: "ge_batumi", name: "Батуми", hh: "28", habr: "", sj: "" },
  ],
  "azerbaijan": [
    { id: "az_all", name: "Весь Азербайджан", hh: "8", habr: "c_15", sj: "c_13" },
    { id: "az_baku", name: "Баку", hh: "1190", habr: "", sj: "" },
  ],
  "kyrgyzstan": [
    { id: "kg_all", name: "Весь Кыргызстан", hh: "48", habr: "c_12", sj: "c_12" },
    { id: "kg_bishkek", name: "Бишкек", hh: "1376", habr: "", sj: "" },
  ],
  "moldova": [
    { id: "md_all", name: "Вся Молдова", hh: "65", habr: "c_19", sj: "c_16" },
    { id: "md_chisinau", name: "Кишинев", hh: "2758", habr: "", sj: "" },
  ],
  "tajikistan": [
    { id: "tj_all", name: "Весь Таджикистан", hh: "83", habr: "c_20", sj: "c_17" },
    { id: "tj_dushanbe", name: "Душанбе", hh: "1382", habr: "", sj: "" },
  ],
  "turkmenistan": [
    { id: "tm_all", name: "Весь Туркменистан", hh: "89", habr: "c_21", sj: "c_19" },
    { id: "tm_ashgabat", name: "Ашхабад", hh: "89", habr: "", sj: "" },
  ],
  "uzbekistan": [
    { id: "uz_all", name: "Весь Узбекистан", hh: "97", habr: "c_11", sj: "c_11" },
    { id: "uz_tashkent", name: "Ташкент", hh: "2759", habr: "", sj: "" },
  ],
  "germany": [
    { id: "de_all", name: "Вся Германия", hh: "26", habr: "c_33", sj: "" },
    { id: "de_berlin", name: "Берлин", hh: "26", habr: "", sj: "" },
    { id: "de_munich", name: "Мюнхен", hh: "26", habr: "", sj: "" },
    { id: "de_frankfurt", name: "Франкфурт", hh: "26", habr: "", sj: "" },
  ],
  "uk": [
    { id: "uk_all", name: "Вся Великобритания", hh: "43", habr: "c_34", sj: "" },
    { id: "uk_london", name: "Лондон", hh: "43", habr: "", sj: "" },
    { id: "uk_manchester", name: "Манчестер", hh: "43", habr: "", sj: "" },
  ],
  "poland": [
    { id: "pl_all", name: "Вся Польша", hh: "75", habr: "c_51", sj: "" },
    { id: "pl_warsaw", name: "Варшава", hh: "75", habr: "", sj: "" },
    { id: "pl_krakow", name: "Краков", hh: "75", habr: "", sj: "" },
  ],
  "cyprus": [
    { id: "cy_all", name: "Весь Кипр", hh: "102", habr: "c_40", sj: "" },
    { id: "cy_limassol", name: "Лимассол", hh: "102", habr: "", sj: "" },
    { id: "cy_nicosia", name: "Никосия", hh: "102", habr: "", sj: "" },
  ],
  "serbia": [
    { id: "rs_all", name: "Вся Сербия", hh: "80", habr: "c_81", sj: "" },
    { id: "rs_belgrade", name: "Белград", hh: "80", habr: "", sj: "" },
    { id: "rs_novisad", name: "Нови-Сад", hh: "80", habr: "", sj: "" },
  ],
  "nl": [
    { id: "nl_all", name: "Все Нидерланды", hh: "68", habr: "c_62", sj: "" },
    { id: "nl_amsterdam", name: "Амстердам", hh: "68", habr: "", sj: "" },
    { id: "nl_rotterdam", name: "Роттердам", hh: "68", habr: "", sj: "" },
  ],
  "france": [
    { id: "fr_all", name: "Вся Франция", hh: "39", habr: "c_35", sj: "" },
    { id: "fr_paris", name: "Париж", hh: "39", habr: "", sj: "" },
    { id: "fr_marseille", name: "Марсель", hh: "39", habr: "", sj: "" },
  ],
  "spain": [
    { id: "es_all", name: "Вся Испания", hh: "41", habr: "c_42", sj: "" },
    { id: "es_madrid", name: "Мадрид", hh: "41", habr: "", sj: "" },
    { id: "es_barcelona", name: "Барселона", hh: "41", habr: "", sj: "" },
  ]
};