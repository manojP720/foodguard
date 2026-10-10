const API_URL = "http://localhost:5000/api/foods";

export async function getFoods() {
  const response = await fetch(API_URL);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to fetch food items");
  }

  return result.data;
}

export async function addFood(food) {
  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(food),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to add food item");
  }

  return result.data;
}

export async function updateFood(id, updates) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update food item");
  }

  return result.data;
}

export async function deleteFood(id) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "DELETE",
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to delete food item");
  }

  return result.data;
}