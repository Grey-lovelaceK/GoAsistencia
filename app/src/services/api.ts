const BASE_URL = import.meta.env.VITE_API_URL ?? "https://api.gotest.app/v1";
const TOKEN_KEY = "gotest_token";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem(TOKEN_KEY);
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as Record<string, unknown>;
    throw new ApiError(
      res.status,
      typeof body.error === "string" ? body.error : "UNKNOWN_ERROR",
      typeof body.error === "string" ? body.error : res.statusText,
    );
  }

  return res.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "POST", body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: "PUT", body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
  putBlob: (url: string, blob: Blob, contentType: string) =>
    fetch(url, { method: "PUT", body: blob, headers: { "Content-Type": contentType } }),
};

export function buildQuery(params?: object): string {
  if (!params) return "";
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) clean[k] = String(v);
  }
  const qs = new URLSearchParams(clean).toString();
  return qs ? `?${qs}` : "";
}
