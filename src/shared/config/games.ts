export type SupportedLocale = "uk" | "en";

export interface LocalizedGameText {
  uk: string;
  en: string;
}

export type GameSlug =
  | "wheel-of-fortune"
  | "baby-detective"
  | "secret-missions"
  | "roast"
  | "time-machine"
  | "advice-booth";

export type GameStatus = "live" | "comingSoon";
export type WheelSegmentType = "question" | "task";

export interface GameCatalogItem {
  slug: GameSlug;
  title: LocalizedGameText;
  description: LocalizedGameText;
  status: GameStatus;
}

export interface WheelSegment {
  id: string;
  type: WheelSegmentType;
  label: LocalizedGameText;
  prompt: LocalizedGameText;
  points: number;
}

export const GAMES: GameCatalogItem[] = [
  {
    slug: "wheel-of-fortune",
    title: {
      uk: "Колесо фортуни",
      en: "Wheel of Fortune",
    },
    description: {
      uk: "Крути колесо та отримуй питання або маленьке веселе завдання.",
      en: "Spin the wheel to unlock a question or a playful challenge.",
    },
    status: "live",
  },
  {
    slug: "secret-missions",
    title: {
      uk: "Таємні місії",
      en: "Secret Missions",
    },
    description: {
      uk: "Отримай приховану роль і виконай дружню місію протягом вечора.",
      en: "Unlock a secret role and complete a friendly mission during the party.",
    },
    status: "comingSoon",
  },
  {
    slug: "roast",
    title: {
      uk: "Прожарка молодят",
      en: "Roast the Couple",
    },
    description: {
      uk: "Заверши фразу так, щоб було дотепно, але по-доброму.",
      en: "Finish the prompt with a playful line about the couple.",
    },
    status: "comingSoon",
  },
  {
    slug: "time-machine",
    title: {
      uk: "Машина часу",
      en: "Time Machine",
    },
    description: {
      uk: "Голосуй за смішні прогнози про майбутнє Максима і Діани.",
      en: "Vote on funny predictions about Maksym and Diana's future.",
    },
    status: "comingSoon",
  },
  {
    slug: "advice-booth",
    title: {
      uk: "Порадниця",
      en: "Advice Booth",
    },
    description: {
      uk: "Поділися короткою порадою для шлюбу або сімейного життя.",
      en: "Leave a short piece of advice for married life.",
    },
    status: "comingSoon",
  },
  {
    slug: "baby-detective",
    title: {
      uk: "Дитячий детектив",
      en: "Baby Detective",
    },
    description: {
      uk: "Вгадай, кому належить дитяче фото, і познайомся з гостями ближче.",
      en: "Guess whose childhood photo is on screen and get to know the guests.",
    },
    status: "comingSoon",
  },
];

export const WHEEL_OF_FORTUNE_SEGMENTS: WheelSegment[] = [
  {
    id: "love-first",
    type: "question",
    label: {
      uk: "Перше «люблю»",
      en: "First “I love you”",
    },
    prompt: {
      uk: "Хто перший сказав «люблю»?",
      en: "Who said “I love you” first?",
    },
    points: 12,
  },
  {
    id: "cross-table-selfie",
    type: "task",
    label: {
      uk: "Фото-знайомство",
      en: "Cross-table selfie",
    },
    prompt: {
      uk: "Зроби фото з кимось за іншим столом.",
      en: "Take a selfie with someone from another table.",
    },
    points: 18,
  },
  {
    id: "share-memory",
    type: "task",
    label: {
      uk: "Спогад",
      en: "Share a memory",
    },
    prompt: {
      uk: "Розкажи короткий спогад про молодят.",
      en: "Share a short memory about the couple.",
    },
    points: 15,
  },
  {
    id: "first-move",
    type: "question",
    label: {
      uk: "Перший крок",
      en: "First move",
    },
    prompt: {
      uk: "Хто зробив перший крок у ваших стосунках?",
      en: "Who made the first move in your relationship?",
    },
    points: 10,
  },
  {
    id: "kind-toast",
    type: "task",
    label: {
      uk: "Тост одним реченням",
      en: "One-line toast",
    },
    prompt: {
      uk: "Скажи молодятам короткий тост одним реченням.",
      en: "Give the couple a one-line toast.",
    },
    points: 16,
  },
  {
    id: "future-pet",
    type: "question",
    label: {
      uk: "Домашній улюбленець",
      en: "Future pet",
    },
    prompt: {
      uk: "Хто перший скаже: «Давай заведемо домашнього улюбленця»?",
      en: "Who will be the first to say, “Let’s get a pet”?",
    },
    points: 11,
  },
  {
    id: "compliment-chain",
    type: "task",
    label: {
      uk: "Ланцюжок компліментів",
      en: "Compliment chain",
    },
    prompt: {
      uk: "Зроби три щирі компліменти людям поруч із тобою.",
      en: "Give three sincere compliments to people around you.",
    },
    points: 20,
  },
  {
    id: "first-dance-pick",
    type: "question",
    label: {
      uk: "Танцювальний хіт",
      en: "Dancefloor hit",
    },
    prompt: {
      uk: "Яка пісня найкраще описує перший танець молодят?",
      en: "Which song best describes the couple’s first dance?",
    },
    points: 13,
  },
];

export function getGameBySlug(slug: string) {
  return GAMES.find((game) => game.slug === slug);
}

export function getPlayableGames() {
  return GAMES.filter((game) => game.status === "live");
}

export function getPlayableGameSlugs() {
  return getPlayableGames().map((game) => game.slug);
}

export function isGamePlayable(slug: string) {
  return getPlayableGameSlugs().includes(slug as GameSlug);
}

export function getWheelSegmentById(id: string) {
  return WHEEL_OF_FORTUNE_SEGMENTS.find((segment) => segment.id === id);
}
