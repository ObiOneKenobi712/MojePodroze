// Klient API: jedno miejsce, które rozmawia z backendem.
// Dokleja nagłówek X-User-Id i zamienia błędy z API na ApiError z polskim komunikatem.

const USER_ID_KEY = "userId";
const BACKEND_DOWN = "Brak połączenia z serwerem. Sprawdź, czy backend działa (make run).";

/** Zdarzenie wysyłane, gdy backend nie rozpozna użytkownika – RequireAuth przenosi wtedy na logowanie. */
export const LOGOUT_EVENT = "app:logout";
const SESSION_INVALID_CODES = ["AUTH_REQUIRED", "INVALID_USER"];

export function getUserId(): string | null {
  return localStorage.getItem(USER_ID_KEY);
}

export function setUserId(id: number): void {
  localStorage.setItem(USER_ID_KEY, String(id));
}

export function clearUserId(): void {
  localStorage.removeItem(USER_ID_KEY);
}

/** Błąd pola z odpowiedzi 422 VALIDATION_ERROR */
export interface FieldError {
  field: string;
  message: string;
  type: string;
}

/** Błąd zwrócony przez API: {"detail": "komunikat", "code": "STAŁY_KOD", "errors"?: [...]} */
export class ApiError extends Error {
  status: number;
  code: string;
  errors: FieldError[];

  constructor(status: number, code: string, message: string, errors: FieldError[] = []) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.errors = errors;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const headers: Record<string, string> = { Accept: "application/json" };
  const userId = getUserId();
  if (userId) headers["X-User-Id"] = userId;
  // FormData (pliki) wysyłamy bez Content-Type – przeglądarka sama doda granicę multipart
  const isForm = body instanceof FormData;
  if (body !== undefined && !isForm) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(`/api${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", BACKEND_DOWN);
  }

  // 502/504 zwraca serwer Vite, gdy backend nie jest uruchomiony
  if (response.status === 502 || response.status === 504) {
    throw new ApiError(response.status, "NETWORK_ERROR", BACKEND_DOWN);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => null);

  // Brak lub nieważne id użytkownika (np. po wyczyszczeniu bazy) → wyloguj
  if (response.status === 401 && SESSION_INVALID_CODES.includes(data?.code)) {
    clearUserId();
    window.dispatchEvent(new Event(LOGOUT_EVENT));
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data?.code ?? "UNKNOWN_ERROR",
      data?.detail ?? `Serwer zwrócił błąd ${response.status}.`,
      Array.isArray(data?.errors) ? data.errors : [],
    );
  }
  return data as T;
}

/**
 * Plik zdjęcia (np. `file_url` z API: "/api/trips/1/photos/2/file") jako obiekt Blob.
 * Wymaga nagłówka X-User-Id, dlatego nie da się go wstawić wprost do <img src>.
 */
async function getBlob(url: string): Promise<Blob> {
  const headers: Record<string, string> = {};
  const userId = getUserId();
  if (userId) headers["X-User-Id"] = userId;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new ApiError(response.status, "FILE_ERROR", "Nie udało się pobrać zdjęcia.");
  return response.blob();
}

export const api = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  /** Zmiana części pól, np. dzień i podpis zdjęcia */
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
  /** multipart/form-data, np. wgranie zdjęcia */
  upload: <T>(path: string, form: FormData) => request<T>("POST", path, form),
  getBlob,
};
