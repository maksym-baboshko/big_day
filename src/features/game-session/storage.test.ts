import type { PlayerSessionSnapshot } from "./types";
import {
  clearStoredPlayerSession,
  getPlayerSessionSnapshot,
  readStoredPlayerSession,
  subscribeToPlayerSession,
  writeStoredPlayerSession,
} from "./storage";

const session: PlayerSessionSnapshot = {
  playerId: "player-1",
  nickname: "Maksym",
  avatarKey: "olive-branch",
  totalPoints: 42,
};

describe("game-session storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    clearStoredPlayerSession();
  });

  it("writes and reads the stored player session", () => {
    writeStoredPlayerSession(session);

    expect(readStoredPlayerSession()).toEqual(session);
    expect(getPlayerSessionSnapshot()).toEqual(session);
  });

  it("returns null for invalid stored JSON", () => {
    window.localStorage.setItem("big-day.games.player-session.v2", "{bad json");

    expect(readStoredPlayerSession()).toBeNull();
  });

  it("notifies subscribers on writes, clears, and storage events", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToPlayerSession(listener);

    writeStoredPlayerSession(session);
    clearStoredPlayerSession();
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "big-day.games.player-session.v2",
      })
    );

    expect(listener).toHaveBeenCalledTimes(3);
    unsubscribe();
  });
});
