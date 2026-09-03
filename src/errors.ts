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
  /** Minimum plan that unlocks the endpoint, e.g. "Business". */
  readonly requiredPlan: string | undefined;
  /** The plan the calling key is currently on, e.g. "Free". */
  readonly currentPlan: string | undefined;
  /** Where to upgrade. */
  readonly upgradeUrl: string | undefined;

  constructor(
    message: string,
    requiredPlan?: string,
    currentPlan?: string,
    upgradeUrl?: string,
  ) {
    super(message, 402, "PLAN_REQUIRED");
    this.name = "PlanError";
    this.requiredPlan = requiredPlan;
    this.currentPlan = currentPlan;
    this.upgradeUrl = upgradeUrl;
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

// Backend message shape for the plan-gated *pagination depth* 402 (see
// PaginationHelpers.MaxPageFor / TransactionsEndpoints.cs / CongressEndpoints.cs
// on the API). This is deliberately narrow: `error.code` is "PLAN_REQUIRED" for
// EVERY 402 the API returns — a whole-endpoint plan gate (e.g. GET /v1/signals
// on a sub-Business key) and a plan-gated query parameter both use the same
// code — so the message text is the only reliable signal that a given 402 is
// specifically the depth limit rather than some other plan gate. If the
// backend ever changes this message shape, the regex stops matching and
// `paginate()` re-raises the original `PlanError` untouched instead of
// mislabeling an unrelated 402.
const PAGINATION_DEPTH_MESSAGE_RE = /pagination depth on \/v1\//i;

/**
 * True when `err` is specifically the plan-gated pagination-depth 402 that
 * `paginate()` knows how to turn into a `PaginationLimitError`.
 */
export function isPaginationDepthError(err: unknown): err is PlanError {
  return err instanceof PlanError && PAGINATION_DEPTH_MESSAGE_RE.test(err.message);
}

/**
 * Thrown by `paginate()` (on `transactions` and `signals`) when the backend
 * rejects the next page because the calling key's plan has reached its
 * pagination depth limit (Free: 20 pages, Starter: 100, Pro+: unlimited).
 *
 * Pages already yielded before this point were real, complete pages — this
 * error only means iteration stopped early, not that any data already
 * delivered to the caller was wrong. `pagesYielded` tells you exactly how
 * many. The original `PlanError` is preserved as `cause`.
 *
 * **Extends `PlanError` deliberately.** Before this type existed, `paginate()`
 * threw a plain `PlanError` at the depth limit, so code written as
 * `catch (e) { if (e instanceof PlanError) ... }` was the documented way to
 * handle it. Subclassing keeps every one of those handlers working while
 * letting new code catch the narrower type — and it is the truthful
 * relationship anyway, since this IS a 402 PLAN_REQUIRED. Making it a sibling
 * would break existing callers for no gain.
 */
export class PaginationLimitError extends PlanError {
  /** Number of pages successfully yielded by paginate() before this error. */
  readonly pagesYielded: number;

  constructor(message: string, pagesYielded: number, cause: unknown) {
    // Carry the upgrade metadata through from the original 402 where the
    // backend supplied it, so a caller can link straight to the upgrade page
    // without unwrapping `cause` themselves. The depth-limit branch populates
    // upgradeUrl but leaves requiredPlan/currentPlan null.
    const original = cause instanceof PlanError ? cause : undefined;
    super(message, original?.requiredPlan, original?.currentPlan, original?.upgradeUrl);
    this.name = "PaginationLimitError";
    this.pagesYielded = pagesYielded;
    this.cause = cause;
  }
}
