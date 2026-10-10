
const API_URL = "http://localhost:5000/api/foods";

export async function updateFood(id, updates) {
  const response = await fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || "Failed to update food item");
  }

  return result.data;
}
