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

export interface GameCatalogItem {
  slug: GameSlug;
  title: LocalizedGameText;
  description: LocalizedGameText;
  status: GameStatus;
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

// Typed tuple of all game slugs — use this for Zod enums instead of
// duplicating the list across route files.
export const GAME_SLUG_ENUM = GAMES.map((g) => g.slug) as [GameSlug, ...GameSlug[]];

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
