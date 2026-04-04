import { apiFetch, setAccessToken } from "./api";

const LOGIN_EMAIL = "admin@admin.com";
const LOGIN_PASSWORD = "admin123";

export async function login() {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: LOGIN_EMAIL,
      password: LOGIN_PASSWORD,
    }),
  });
  const data = await response.json();
  setAccessToken(data.accessToken);
  return data;
}