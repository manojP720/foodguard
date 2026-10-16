
const API_URL = "http://localhost:5000/api/foods";

function getToken() {
  return sessionStorage.getItem("foodguard_token");
}

async function foodRequest(url, options = {}) {
  const token = getToken();

  if (!token) {
    throw new Error("Please log in to continue.");
  }

  const response = await fetch(url, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  const result = await response.json();

  if (response.status === 401) {
    sessionStorage.removeItem("foodguard_token");
    sessionStorage.removeItem("foodguard_user");
    window.dispatchEvent(new Event("foodguard:logout"));
    throw new Error("Session expired. Please log in again.");
  }

  if (!response.ok) {
    throw new Error(result.message || "Food API request failed.");
  }

  return result;
}

export async function getFoods() {
  const result = await foodRequest(API_URL);
  return result.data;
}

export async function addFood(food) {
  const result = await foodRequest(API_URL, {
    method: "POST",
    body: JSON.stringify(food),
  });

  return result.data;
}

export async function updateFood(id, updates) {
  const result = await foodRequest(`${API_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return result.data;
}

export async function deleteFood(id) {
  return foodRequest(`${API_URL}/${id}`, {
    method: "DELETE",
  });
}
