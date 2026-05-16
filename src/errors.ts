export class InsiderApiError extends Error {
  readonly statusCode: number;
  readonly errorCode: string | null;

  constructor(message: string, statusCode: number, errorCode: string | null = null) {
    super(message);
    this.name = "InsiderApiError";
    this.statusCode = statusCode;
    this.errorCode = errorCode;
  }
}

export class AuthError extends InsiderApiError {
  constructor(message: string, errorCode: string | null = null) {
    super(message, 401, errorCode);
    this.name = "AuthError";
  }
}

export class PlanError extends InsiderApiError {
  readonly requiredPlan: string | undefined;

  constructor(message: string, requiredPlan?: string) {
    super(message, 402, "PLAN_REQUIRED");
    this.name = "PlanError";
    this.requiredPlan = requiredPlan;
  }
}

export class NotFoundError extends InsiderApiError {
  constructor(message: string, errorCode: string | null = null) {
    super(message, 404, errorCode);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends InsiderApiError {
  readonly retryAfter: number | undefined;

  constructor(message: string, retryAfter?: number) {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
    this.name = "RateLimitError";
    this.retryAfter = retryAfter;
  }
}
