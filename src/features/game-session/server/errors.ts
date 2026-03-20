export class PlayerProfileNotReadyError extends Error {
  constructor() {
    super("The player profile is not ready yet.");
    this.name = "PlayerProfileNotReadyError";
  }
}

export class WheelTasksDepletedError extends Error {
  constructor() {
    super("No wheel tasks remain for this player.");
    this.name = "WheelTasksDepletedError";
  }
}

export class WheelRoundNotFoundError extends Error {
  constructor() {
    super("The wheel round was not found.");
    this.name = "WheelRoundNotFoundError";
  }
}

export class WheelRoundAlreadyResolvedError extends Error {
  constructor() {
    super("The wheel round is already resolved.");
    this.name = "WheelRoundAlreadyResolvedError";
  }
}

export class InvalidWheelRoundResponseError extends Error {
  constructor() {
    super("The wheel round response is invalid.");
    this.name = "InvalidWheelRoundResponseError";
  }
}

export class InvalidWheelRoundStateError extends Error {
  constructor() {
    super("The wheel round state is invalid.");
    this.name = "InvalidWheelRoundStateError";
  }
}
