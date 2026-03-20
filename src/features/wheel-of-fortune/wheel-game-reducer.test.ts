import {
  createInitialWheelGameState,
  getRoundTimerRemaining,
  wheelGameReducer,
} from "./wheel-game-reducer";
import type { WheelRoundSnapshot } from "@/features/game-session";
import type { RecentResultItem } from "./wheel-helpers";

const round: WheelRoundSnapshot = {
  roundId: "round-1",
  sessionId: "session-1",
  cycleNumber: 1,
  selectionRank: 1,
  spinAngle: 120,
  category: {
    slug: "icebreaker",
    title: "Icebreaker",
    description: "Warm up",
  },
  task: {
    taskKey: "task-1",
    interactionType: "text_input",
    responseMode: "text_input",
    executionMode: "timed",
    allowPromise: true,
    allowEarlyCompletion: true,
    difficulty: "gentle",
    prompt: "Say hi",
    details: null,
    choiceOptions: null,
    timerSeconds: 20,
    completionXp: 10,
    promiseXp: 5,
    skipPenaltyXp: -2,
    timeoutPenaltyXp: -4,
  },
  timer: {
    status: "idle",
    durationSeconds: 20,
    startedAt: null,
    pausedAt: null,
    remainingSeconds: 20,
  },
};

const recentResult: RecentResultItem = {
  roundId: round.roundId,
  prompt: round.task.prompt,
  categorySlug: round.category.slug,
  categoryTitle: round.category.title,
  resolution: "completed",
  xpDelta: 10,
};

describe("wheel-game-reducer", () => {
  it("reads timer remaining from timer or task defaults", () => {
    expect(getRoundTimerRemaining(round)).toBe(20);
    expect(
      getRoundTimerRemaining({
        ...round,
        timer: null,
      })
    ).toBe(20);
    expect(getRoundTimerRemaining(null)).toBeNull();
  });

  it("resets stale round state when a new spin is requested", () => {
    const nextState = wheelGameReducer(
      {
        ...createInitialWheelGameState(),
        activeRound: round,
        resolvedRound: {
          ...round,
          resolution: "completed",
          resolutionReason: "not_applicable",
          xpDelta: 10,
          responseText: "Done",
        },
        isChallengeOpen: true,
        responseText: "Old answer",
        validationMessage: "Old validation",
        errorCode: "INVALID_DATA",
        showConfetti: true,
        pointerLand: true,
      },
      { type: "spin_requested" }
    );

    expect(nextState.isPreparingRound).toBe(true);
    expect(nextState.isSpinning).toBe(true);
    expect(nextState.activeRound).toBeNull();
    expect(nextState.resolvedRound).toBeNull();
    expect(nextState.isChallengeOpen).toBe(false);
    expect(nextState.responseText).toBe("");
    expect(nextState.validationMessage).toBeNull();
    expect(nextState.errorCode).toBeNull();
    expect(nextState.showConfetti).toBe(false);
    expect(nextState.pointerLand).toBe(false);
  });

  it("opens the overlay when a round is restored", () => {
    const nextState = wheelGameReducer(createInitialWheelGameState(), {
      type: "round_restored",
      round,
    });

    expect(nextState.activeRound).toEqual(round);
    expect(nextState.isChallengeOpen).toBe(true);
    expect(nextState.timerRemaining).toBe(20);
    expect(nextState.errorCode).toBeNull();
  });

  it("records resolved rounds and prepends recent results", () => {
    const nextState = wheelGameReducer(createInitialWheelGameState(), {
      type: "round_resolved",
      round: {
        ...round,
        resolution: "completed",
        resolutionReason: "not_applicable",
        xpDelta: 10,
        responseText: "Done",
      },
      recentResult,
    });

    expect(nextState.isResolving).toBe(false);
    expect(nextState.resolvedRound?.resolution).toBe("completed");
    expect(nextState.isChallengeOpen).toBe(false);
    expect(nextState.showConfetti).toBe(true);
    expect(nextState.confettiKey).toBe(1);
    expect(nextState.recentResults).toEqual([recentResult]);
  });

  it("covers the spin and timer lifecycle transitions", () => {
    const baseState = {
      ...createInitialWheelGameState(),
      isPreparingRound: true,
      isSpinning: true,
      validationMessage: "Old validation",
      errorCode: "INVALID_DATA" as const,
    };

    const cancelledState = wheelGameReducer(baseState, {
      type: "spin_cancelled",
    });
    const failedState = wheelGameReducer(baseState, {
      type: "spin_failed",
      errorCode: "PERSISTENCE_ERROR",
    });
    const preparationCompletedState = wheelGameReducer(baseState, {
      type: "spin_preparation_completed",
    });
    const finalizedState = wheelGameReducer(baseState, {
      type: "spin_round_finalized",
      round,
    });
    const timerRequestedState = wheelGameReducer(baseState, {
      type: "timer_start_requested",
    });
    const timerStartedState = wheelGameReducer(baseState, {
      type: "timer_started",
      round,
    });
    const timerFinishedState = wheelGameReducer(timerRequestedState, {
      type: "timer_start_finished",
    });
    const timerFailedState = wheelGameReducer(timerRequestedState, {
      type: "timer_start_failed",
      errorCode: "PERSISTENCE_ERROR",
    });
    const timerSyncedState = wheelGameReducer(baseState, {
      type: "timer_sync",
      round,
    });
    const timerTickedState = wheelGameReducer(baseState, {
      type: "timer_tick",
      remainingSeconds: 7,
    });

    expect(cancelledState.isPreparingRound).toBe(false);
    expect(cancelledState.isSpinning).toBe(false);
    expect(failedState.errorCode).toBe("PERSISTENCE_ERROR");
    expect(preparationCompletedState.isPreparingRound).toBe(false);
    expect(finalizedState.isChallengeOpen).toBe(true);
    expect(finalizedState.pointerLand).toBe(true);
    expect(timerRequestedState.isStartingTimer).toBe(true);
    expect(timerRequestedState.validationMessage).toBeNull();
    expect(timerRequestedState.errorCode).toBeNull();
    expect(timerStartedState.activeRound).toEqual(round);
    expect(timerStartedState.timerRemaining).toBe(20);
    expect(timerFinishedState.isStartingTimer).toBe(false);
    expect(timerFailedState.errorCode).toBe("PERSISTENCE_ERROR");
    expect(timerSyncedState.timerRemaining).toBe(20);
    expect(timerTickedState.timerRemaining).toBe(7);
  });

  it("covers resolve, restore, and ui feedback transitions", () => {
    const baseState = {
      ...createInitialWheelGameState(),
      isResolving: false,
      isRestoringRound: false,
      pointerLand: true,
      showConfetti: true,
      validationMessage: "Old validation",
      errorCode: "INVALID_DATA" as const,
    };

    const resolveRequestedState = wheelGameReducer(baseState, {
      type: "resolve_requested",
    });
    const resolveFinishedState = wheelGameReducer(resolveRequestedState, {
      type: "resolve_finished",
    });
    const restoreRequestedState = wheelGameReducer(baseState, {
      type: "restore_requested",
    });
    const restoreFailedState = wheelGameReducer(baseState, {
      type: "restore_failed",
      errorCode: "PERSISTENCE_ERROR",
    });
    const restoreFinishedState = wheelGameReducer(restoreRequestedState, {
      type: "restore_finished",
    });
    const responseTextState = wheelGameReducer(baseState, {
      type: "response_text_changed",
      value: "Updated answer",
    });
    const validationState = wheelGameReducer(baseState, {
      type: "validation_set",
      message: "Required",
    });
    const validationClearedState = wheelGameReducer(validationState, {
      type: "validation_cleared",
    });
    const errorState = wheelGameReducer(baseState, {
      type: "error_set",
      errorCode: null,
    });
    const pointerClearedState = wheelGameReducer(baseState, {
      type: "pointer_land_cleared",
    });
    const confettiHiddenState = wheelGameReducer(baseState, {
      type: "confetti_hidden",
    });

    expect(resolveRequestedState.isResolving).toBe(true);
    expect(resolveRequestedState.validationMessage).toBeNull();
    expect(resolveRequestedState.errorCode).toBeNull();
    expect(resolveFinishedState.isResolving).toBe(false);
    expect(restoreRequestedState.isRestoringRound).toBe(true);
    expect(restoreFailedState.errorCode).toBe("PERSISTENCE_ERROR");
    expect(restoreFinishedState.isRestoringRound).toBe(false);
    expect(responseTextState.responseText).toBe("Updated answer");
    expect(responseTextState.validationMessage).toBeNull();
    expect(validationState.validationMessage).toBe("Required");
    expect(validationClearedState.validationMessage).toBeNull();
    expect(errorState.errorCode).toBeNull();
    expect(pointerClearedState.pointerLand).toBe(false);
    expect(confettiHiddenState.showConfetti).toBe(false);
  });
});
