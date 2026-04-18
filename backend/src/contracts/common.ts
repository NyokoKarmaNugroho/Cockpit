/** Shared primitives for API responses and pagination. */

export type IsoDateTimeString = string;

export type ApiErrorBody = {
  error: string;
  message: string;
  details?: Record<string, unknown>;
  requestId?: string;
};

export type Paginated<T> = {
  items: T[];
  nextCursor?: string | null;
  /** Total when cheap to compute; optional for cursor-only APIs */
  total?: number;
};
