interface LocalizedGuestText {
  uk: string;
  en: string;
}

export interface Guest {
  slug: string;
  name: LocalizedGuestText;
  vocative: LocalizedGuestText;
  formName?: LocalizedGuestText;
  seats: number;
}

export const guests: Guest[] = [
  {
    slug: 'papa-ihor',
    name: { uk: 'Папа Ігор', en: 'Papa Ihor' },
    vocative: { uk: 'Папа Ігор', en: 'Papa Ihor' },
    formName: { uk: 'Ігор Бабошко', en: 'Ihor Baboshko' },
    seats: 4
  },
  {
    slug: 'mama-ira',
    name: { uk: 'Мама Іра', en: 'Mama Ira' },
    vocative: { uk: 'Мама Іра', en: 'Mama Ira' },
    formName: { uk: 'Іра Авдієва', en: 'Ira Avdieieva' },
    seats: 1
  },
  {
    slug: 'didus-valentyn',
    name: { uk: 'Дідусь Валентин', en: 'Grandpa Valentyn' },
    vocative: { uk: 'Дідусю Валентине', en: 'Grandpa Valentyn' },
    formName: { uk: 'Валентин Бабошко', en: 'Valentyn Baboshko' },
    seats: 1
  },
  {
    slug: 'babusia-alla',
    name: { uk: 'Бабуся Алла', en: 'Grandma Alla' },
    vocative: { uk: 'Бабусю Алло', en: 'Grandma Alla' },
    formName: { uk: 'Алла Роднєва', en: 'Alla Rodneva' },
    seats: 1
  },
  {
    slug: 'family-prodan',
    name: { uk: 'Родина Продан', en: 'Prodan Family' },
    vocative: { uk: 'Родино Продан', en: 'Prodan Family' },
    formName: { uk: 'Віталій Продан', en: 'Vitalii Prodan' },
    seats: 3
  },
  {
    slug: 'family-dedikert',
    name: { uk: 'Родина Дедікерт', en: 'Dedikert Family' },
    vocative: { uk: 'Михайло та Віталіно', en: 'Dedikert Family' },
    formName: { uk: 'Михайло Дедікерт', en: 'Mykhailo Dedikert' },
    seats: 2
  },
  {
    slug: 'family-kruk',
    name: { uk: 'Родина Крук', en: 'Kruk Family' },
    vocative: { uk: 'Тарасе та Анжеліко', en: 'Kruk Family' },
    formName: { uk: 'Тарас Крук', en: 'Taras Kruk' },
    seats: 2
  },
  {
    slug: 'oleksandr-nila',
    name: {
      uk: 'Дідусь Олександр та бабуся Ніла',
      en: 'Grandpa Oleksandr and Grandma Nila'
    },
    vocative: {
      uk: 'Дідусю Олександре та бабусю Ніло',
      en: 'Grandpa Oleksandr and Grandma Nila'
    },
    formName: { uk: 'Олександр', en: 'Oleksandr' },
    seats: 2
  },
  {
    slug: 'babusia-halyna',
    name: { uk: 'Бабуся Галина', en: 'Grandma Halyna' },
    vocative: { uk: 'Бабусю Галино', en: 'Grandma Halyna' },
    formName: { uk: 'Галина', en: 'Halyna' },
    seats: 1
  },
  {
    slug: 'serhii-prodan',
    name: { uk: 'Сергій', en: 'Serhii' },
    vocative: { uk: 'Сергію', en: 'Serhii' },
    formName: { uk: 'Сергій Продан', en: 'Serhii Prodan' },
    seats: 2
  },
  {
    slug: 'family-sundal',
    name: { uk: 'Родина Сундал', en: 'Sundal Family' },
    vocative: { uk: 'Родино Сундал', en: 'Sundal Family' },
    formName: { uk: 'Антоніна Сундал', en: 'Antonina Sundal' },
    seats: 4
  },
  {
    slug: 'family-shevchuk',
    name: { uk: 'Родина Шевчук', en: 'Shevchuk Family' },
    vocative: { uk: 'Родино Шевчук', en: 'Shevchuk Family' },
    formName: { uk: 'Олександр Шевчук', en: 'Oleksandr Shevchuk' },
    seats: 5
  },
  {
    slug: 'virsaviia-berezna',
    name: { uk: 'Вірсавія', en: 'Virsaviia' },
    vocative: { uk: 'Вірсавіє', en: 'Virsaviia' },
    formName: { uk: 'Вірсавія Березна', en: 'Virsaviia Berezna' },
    seats: 1
  },
  {
    slug: 'family-sheiko',
    name: { uk: 'Родина Шейко', en: 'Sheiko Family' },
    vocative: { uk: 'Родино Шейко', en: 'Sheiko Family' },
    formName: { uk: 'Даніл Шейко', en: 'Danil Sheiko' },
    seats: 2
  },
  {
    slug: 'oleksandr-anastasiia',
    name: { uk: 'Олександр і Анастасія', en: 'Oleksandr and Anastasiia' },
    vocative: { uk: 'Олександре та Анастасіє', en: 'Oleksandr and Anastasiia' },
    formName: { uk: 'Олександр Кулачінський', en: 'Oleksandr Kulachinskyi' },
    seats: 2
  },
  {
    slug: 'dmytro-anna',
    name: { uk: 'Дмитро і Анна', en: 'Dmytro and Anna' },
    vocative: { uk: 'Дмитро та Анно', en: 'Dmytro and Anna' },
    formName: { uk: 'Дмитро Ржавський', en: 'Dmytro Rzhavskyi' },
    seats: 2
  },
  {
    slug: 'oleksii-turchyn',
    name: { uk: 'Олексій Турчин', en: 'Oleksii Turchyn' },
    vocative: { uk: 'Олексію', en: 'Oleksii Turchyn' },
    formName: { uk: 'Олексій Турчин', en: 'Oleksii Turchyn' },
    seats: 1
  },
  {
    slug: 'hlib-viola',
    name: { uk: 'Гліб і Віола', en: 'Hlib and Viola' },
    vocative: { uk: 'Гліб та Віола', en: 'Hlib and Viola' },
    formName: { uk: 'Гліб Сопинській', en: 'Hlib Sopinskyi' },
    seats: 2
  },
  {
    slug: 'tornes-family',
    name: { uk: 'Родина Tornes', en: 'Tornes Family' },
    vocative: { uk: 'Родино Tornes', en: 'Tornes Family' },
    formName: { uk: 'Jan Tore Tornes', en: 'Jan Tore Tornes' },
    seats: 2
  },
  {
    slug: 'edhar-harik',
    name: { uk: 'Едгар та Гарік', en: 'Edgar and Harik' },
    vocative: { uk: 'Едгаре та Гаріку', en: 'Edgar and Harik' },
    formName: { uk: 'Едгар Міразізян', en: 'Edgar Mirazizian' },
    seats: 2
  },
  {
    slug: 'roman-anna',
    name: { uk: 'Роман та Анна', en: 'Roman and Anna' },
    vocative: { uk: 'Романе та Анно', en: 'Roman and Anna' },
    formName: { uk: 'Роман Хараньян', en: 'Roman Kharanian' },
    seats: 2
  },
  {
    slug: 'fen-family',
    name: { uk: 'Родина Фень', en: 'Fen Family' },
    vocative: { uk: 'Родино Фень', en: 'Fen Family' },
    formName: { uk: 'Аліна Фень', en: 'Alina Fen' },
    seats: 4
  },
  {
    slug: 'illya-kaleniuk',
    name: { uk: 'Каленюк Ілля Валентинович', en: 'Kaleniuk Illia Valentynovych' },
    vocative: { uk: 'Ілля Валентиновичу', en: 'Kaleniuk Illia Valentynovych' },
    formName: { uk: 'Каленюк Ілля Валентинович', en: 'Kaleniuk Illia Valentynovych' },
    seats: 2
  }
];

export function getGuestBySlug(slug: string): Guest | undefined {
  return guests.find(guest => guest.slug === slug);
}

export function getAllGuestSlugs(): string[] {
  return guests.map(guest => guest.slug);
}
