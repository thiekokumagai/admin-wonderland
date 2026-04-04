let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
};

export const getAccessToken = () => accessToken;

export async function apiFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const headers: HeadersInit = {
    accept: "application/json",
    ...(options.body instanceof FormData
      ? {}
      : { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${import.meta.env.VITE_ADMIN_API}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(`Erro na API: ${response.status}`);
  }
  return response;
}