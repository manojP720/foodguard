
import { API_URL } from "../config/api";

const AUTH_URL = `${API_URL}/auth`;

export async function signup(name, email, password) {
  return authRequest("/signup", { name, email, password });
}

export async function login(email, password) {
  return authRequest("/login", { email, password });
}

async function authRequest(path, body) {
  const response = await fetch(`${AUTH_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(
      "Server returned an unexpected response. Check the backend API route."
    );
  }

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Authentication failed.");
  }

  return result;
}
