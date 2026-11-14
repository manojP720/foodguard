
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000"
).replace(/\/+$/, "");

export const API_URL = `${API_BASE_URL}/api`;
const FOODS_URL = `${API_URL}/foods`;

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
  const result = await foodRequest(FOODS_URL);
  return result.data;
}

export async function addFood(food) {
  const result = await foodRequest(FOODS_URL, {
    method: "POST",
    body: JSON.stringify(food),
  });

  return result.data;
}

export async function updateFood(id, updates) {
  const result = await foodRequest(`${FOODS_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(updates),
  });

  return result.data;
}

export async function deleteFood(id) {
  return foodRequest(`${FOODS_URL}/${id}`, {
    method: "DELETE",
  });
}

function mapCategory(categories = "") {
  const value = categories.toLowerCase();

  if (value.includes("dairy") || value.includes("milk")) return "Dairy";
  if (value.includes("fruit")) return "Fruits";
  if (value.includes("vegetable")) return "Vegetables";
  if (value.includes("bakery") || value.includes("bread")) return "Bakery";
  if (value.includes("seafood") || value.includes("fish")) return "Seafood";
  if (value.includes("meat")) return "Meat";
  if (value.includes("beverage") || value.includes("drink")) return "Beverages";
  if (value.includes("frozen")) return "Frozen";
  if (value.includes("cereal") || value.includes("grain")) return "Grains";

  return "Other";
}

export async function lookupProductByBarcode(barcode) {
  const cleanBarcode = String(barcode).trim();

  if (!/^\d{8,14}$/.test(cleanBarcode)) {
    throw new Error("Please provide a valid product barcode.");
  }

  const url =
    `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(cleanBarcode)}.json?fields=product_name,brands,categories,quantity,code`;

  let response;

  try {
    response = await fetch(url);
  } catch {
    throw new Error("Could not connect to the product catalogue.");
  }

  if (!response.ok) {
    throw new Error("Product catalogue request failed.");
  }

  const result = await response.json();

  if (result.status !== 1 || !result.product) {
    throw new Error("No product found for this barcode.");
  }

  const product = result.product;

  return {
    barcode: product.code || cleanBarcode,
    name: product.product_name || "",
    brand: product.brands || "",
    category: mapCategory(product.categories || ""),
    packageQuantity: product.quantity || "",
  };
}
