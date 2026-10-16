
const API_URL = "http://localhost:5000/api/auth";

export async function signup(name, email, password) {
  return authRequest("/signup", { name, email, password });
}

export async function login(email, password) {
  return authRequest("/login", { email, password });
}

async function authRequest(path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Authentication failed.");
  }

  return result;
}
