
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Clock3,
  Trash2,
  BarChart3,
  Settings,
  Bell,
  Search,
  Plus,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  X,
  LoaderCircle,
  RefreshCw,
  CalendarDays,
  MapPin,
  Pencil,
} from "lucide-react";

import { getFoods, addFood, deleteFood } from "./services/foodService";

const initialForm = {
  name: "",
  category: "Vegetables",
  quantity: "1",
  unit: "pieces",
  purchaseDate: new Date().toLocaleDateString("en-CA"),
  expiryDate: "",
  storageLocation: "Refrigerator",
  notes: "",
};

function getExpiryInfo(expiryDate) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  const days = Math.round((expiry - today) / 86400000);

  if (days < 0) {
    return {
      days,
      status: "danger",
      label: `Expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago`,
    };
  }

  if (days === 0) {
    return { days, status: "warning", label: "Expires today" };
  }

  if (days <= 7) {
    return { days, status: "warning", label: `Expires in ${days} days` };
  }

  return { days, status: "safe", label: `Expires in ${days} days` };
}

function App() {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [form, setForm] = useState(initialForm);

  async function loadFoods() {
    setLoading(true);
    setError("");

    try {
      const data = await getFoods();
      setFoods(data);
    } catch (err) {
      setError(err.message || "Could not load inventory.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  const stats = useMemo(() => {
    const activeFoods = foods.filter((food) => !food.consumed);
    const expiring = activeFoods.filter((food) => {
      const { days } = getExpiryInfo(food.expiryDate);
      return days >= 0 && days <= 7;
    });
    const expired = activeFoods.filter(
      (food) => getExpiryInfo(food.expiryDate).days < 0
    );

    return {
      total: activeFoods.length,
      expiring: expiring.length,
      expired: expired.length,
    };
  }, [foods]);

  const filteredFoods = useMemo(() => {
    let result = foods.filter((food) => {
      const query = search.trim().toLowerCase();
      return (
        food.name.toLowerCase().includes(query) ||
        (food.category || "").toLowerCase().includes(query)
      );
    });

    if (activeView === "Expiring Soon") {
      result = result.filter((food) => {
        const { days } = getExpiryInfo(food.expiryDate);
        return !food.consumed && days >= 0 && days <= 7;
      });
    } else if (activeView === "Food Waste") {
      result = result.filter(
        (food) => !food.consumed && getExpiryInfo(food.expiryDate).days < 0
      );
    } else {
      result = result.filter((food) => !food.consumed);
    }

    return result.sort(
      (a, b) => new Date(a.expiryDate) - new Date(b.expiryDate)
    );
  }, [foods, search, activeView]);

  async function handleAddFood(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (new Date(form.expiryDate) < new Date(form.purchaseDate)) {
      setError("Expiry date cannot be before the purchase date.");
      return;
    }

    setSaving(true);

    try {
      await addFood({
        ...form,
        quantity: Number(form.quantity),
      });

      setForm({
        ...initialForm,
        purchaseDate: new Date().toLocaleDateString("en-CA"),
      });
      setShowModal(false);
      setNotice("Food item saved to MongoDB successfully.");
      await loadFoods();
    } catch (err) {
      setError(err.message || "Could not save food item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFood(id) {
    if (!window.confirm("Delete this food item permanently?")) return;

    setError("");
    setNotice("");

    try {
      await deleteFood(id);
      setFoods((current) => current.filter((food) => food._id !== id));
      setNotice("Food item deleted successfully.");
    } catch (err) {
      setError(err.message || "Could not delete food item.");
    }
  }

  const navigation = [
    { label: "Dashboard", icon: LayoutDashboard },
    { label: "Inventory", icon: Package },
    { label: "Expiring Soon", icon: Clock3 },
    { label: "Food Waste", icon: Trash2 },
    { label: "Analytics", icon: BarChart3 },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <aside className="fixed left-0 top-0 z-20 hidden h-screen w-64 border-r border-white/10 bg-slate-900/80 p-5 lg:block">
        <div className="mb-10 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-500/15 p-2">
            <Leaf className="text-emerald-400" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold">FoodGuard</h1>
            <p className="text-xs text-slate-400">Reduce food waste</p>
          </div>
        </div>

        <nav className="space-y-2">
          {navigation.map(({ label, icon: Icon }) => (
            <button
              key={label}
              onClick={() => setActiveView(label)}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                activeView === label
                  ? "bg-emerald-500/10 text-emerald-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon size={19} />
              {label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => setActiveView("Settings")}
          className="absolute bottom-6 left-5 right-5 flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
        >
          <Settings size={19} />
          Settings
        </button>
      </aside>

      <main className="pb-10 lg:ml-64">
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-5 py-5 backdrop-blur-xl sm:px-8">
          <div>
            <p className="text-sm text-slate-400">Food Inventory</p>
            <h2 className="text-2xl font-bold">{activeView}</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 sm:flex">
              <Search size={17} className="text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search food..."
                className="w-36 bg-transparent py-2.5 text-sm outline-none placeholder:text-slate-500"
              />
            </div>
            <button
              onClick={loadFoods}
              aria-label="Refresh inventory"
              className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"
            >
              <RefreshCw size={19} />
            </button>
            <button
              onClick={() => setNotice("Expiry status updates automatically when inventory is refreshed.")}
              aria-label="Notifications"
              className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10"
            >
              <Bell size={19} />
              {stats.expiring > 0 && (
                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-400" />
              )}
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950">
              M
            </div>
          </div>
        </header>

        <div className="p-5 sm:p-8">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="mb-1 text-slate-400">Good evening 👋</p>
              <h3 className="text-3xl font-bold">Welcome back, Manoj</h3>
              <p className="mt-2 text-slate-400">
                Keep your food fresh and reduce unnecessary waste.
              </p>
            </div>
            <button
              onClick={() => {
                setError("");
                setNotice("");
                setShowModal(true);
              }}
              className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              <Plus size={20} />
              Add Food
            </button>
          </div>

          {error && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
              <span>{error}</span>
              <button onClick={() => setError("")} aria-label="Dismiss error">
                <X size={18} />
              </button>
            </div>
          )}

          {notice && (
            <div className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
              <span>{notice}</span>
              <button onClick={() => setNotice("")} aria-label="Dismiss message">
                <X size={18} />
              </button>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Items"
              value={loading ? "—" : stats.total}
              description="Active inventory items"
              icon={<Package size={22} />}
            />
            <StatCard
              title="Expiring Soon"
              value={loading ? "—" : stats.expiring}
              description="Within the next 7 days"
              icon={<Clock3 size={22} />}
              warning
            />
            <StatCard
              title="Expired"
              value={loading ? "—" : stats.expired}
              description="Needs your attention"
              icon={<AlertTriangle size={22} />}
              danger
            />
            <StatCard
              title="Waste Saved"
              value="—"
              description="Tracking planned next"
              icon={<CheckCircle2 size={22} />}
              success
            />
          </div>

          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-semibold">
                  {activeView === "Dashboard"
                    ? "Recent Inventory"
                    : activeView}
                </h3>
                <p className="text-sm text-slate-400">
                  Live data from your MongoDB database
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs text-emerald-400">
                  {filteredFoods.length} items
                </span>
                <button
                  onClick={() => setActiveView("Inventory")}
                  className="text-sm font-medium text-emerald-400 hover:text-emerald-300"
                >
                  All inventory
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center gap-3 py-12 text-slate-400">
                <LoaderCircle className="animate-spin" size={22} />
                Loading your inventory...
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/10 py-12 text-center">
                <Package className="mx-auto mb-3 text-slate-500" size={35} />
                <p className="font-medium">No food items found</p>
                <p className="mt-1 text-sm text-slate-500">
                  Add your first item to start tracking expiry dates.
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
                >
                  <Plus className="mr-1 inline" size={16} />
                  Add your first food
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFoods.map((food) => (
                  <FoodRow
                    key={food._id}
                    food={food}
                    onDelete={() => handleDeleteFood(food._id)}
                  />
                ))}
              </div>
            )}
          </section>

          <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex gap-4">
              <div className="h-fit rounded-xl bg-emerald-500/10 p-3">
                <Leaf className="text-emerald-400" size={24} />
              </div>
              <div>
                <h3 className="font-semibold">FoodGuard Insight</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  {stats.expiring > 0
                    ? `You have ${stats.expiring} item(s) expiring within 7 days. Try using them first.`
                    : "No items are expiring in the next 7 days. Keep your inventory updated to reduce food waste."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowModal(false);
            }
          }}
        >
          <div className="my-auto w-full max-w-2xl rounded-2xl border border-white/10 bg-slate-900 p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h3 className="text-xl font-bold">Add Food Item</h3>
                <p className="mt-1 text-sm text-slate-400">
                  Enter details to save this item to your inventory.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"
                aria-label="Close form"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddFood} className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField label="Food name *">
                  <input
                    required
                    maxLength={100}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                    placeholder="e.g. Milk"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Category *">
                  <select
                    required
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className={inputClass}
                  >
                    {[
                      "Vegetables",
                      "Fruits",
                      "Dairy",
                      "Meat",
                      "Seafood",
                      "Bakery",
                      "Grains",
                      "Beverages",
                      "Frozen",
                      "Other",
                    ].map((category) => (
                      <option key={category}>{category}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Quantity *">
                  <input
                    type="number"
                    required
                    min="0.01"
                    step="any"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Unit *">
                  <select
                    value={form.unit}
                    onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className={inputClass}
                  >
                    {[
                      "pieces",
                      "packets",
                      "kg",
                      "g",
                      "litres",
                      "ml",
                      "bottles",
                      "cans",
                    ].map((unit) => (
                      <option key={unit}>{unit}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Purchase date *">
                  <input
                    type="date"
                    required
                    value={form.purchaseDate}
                    max={new Date().toLocaleDateString("en-CA")}
                    onChange={(e) =>
                      setForm({ ...form, purchaseDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Expiry date *">
                  <input
                    type="date"
                    required
                    min={form.purchaseDate}
                    value={form.expiryDate}
                    onChange={(e) =>
                      setForm({ ...form, expiryDate: e.target.value })
                    }
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Storage location">
                  <select
                    value={form.storageLocation}
                    onChange={(e) =>
                      setForm({ ...form, storageLocation: e.target.value })
                    }
                    className={inputClass}
                  >
                    {[
                      "Refrigerator",
                      "Freezer",
                      "Pantry",
                      "Kitchen shelf",
                      "Other",
                    ].map((location) => (
                      <option key={location}>{location}</option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Notes (optional)">
                  <input
                    maxLength={300}
                    value={form.notes}
                    onChange={(e) =>
                      setForm({ ...form, notes: e.target.value })
                    }
                    placeholder="Any extra details"
                    className={inputClass}
                  />
                </FormField>
              </div>

              {error && (
                <p className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">
                  {error}
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <LoaderCircle
                        className="mr-2 inline animate-spin"
                        size={17}
                      />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-1 inline" size={17} />
                      Save Food Item
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 text-sm text-white outline-none transition focus:border-emerald-500 placeholder:text-slate-600";

function FormField({ label, children }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm text-slate-300">{label}</span>
      {children}
    </label>
  );
}

function StatCard({
  title,
  value,
  description,
  icon,
  warning,
  danger,
  success,
}) {
  let iconStyle = "bg-white/5 text-slate-300";

  if (warning) iconStyle = "bg-amber-500/10 text-amber-400";
  if (danger) iconStyle = "bg-red-500/10 text-red-400";
  if (success) iconStyle = "bg-emerald-500/10 text-emerald-400";

  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:-translate-y-1 hover:bg-white/[0.05]">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={`rounded-xl p-2.5 ${iconStyle}`}>{icon}</div>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{description}</p>
    </div>
  );
}

function FoodRow({ food, onDelete }) {
  const { status, label } = getExpiryInfo(food.expiryDate);

  const statusStyle =
    status === "danger"
      ? "bg-red-500/10 text-red-400"
      : status === "warning"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-emerald-500/10 text-emerald-400";

  const emojiByCategory = {
    Dairy: "🥛",
    Fruits: "🍎",
    Vegetables: "🥦",
    Bakery: "🍞",
    Meat: "🥩",
    Seafood: "🐟",
    Grains: "🌾",
    Beverages: "🧃",
    Frozen: "🧊",
  };

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-white/5 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/5 text-xl">
          {emojiByCategory[food.category] || "📦"}
        </div>
        <div className="min-w-0">
          <p className="truncate font-medium">{food.name}</p>
          <p className="mt-1 text-xs text-slate-500">
            {food.category} · {food.quantity} {food.unit}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <MapPin size={12} />
            {food.storageLocation || "Pantry"}
          </p>
          <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
            <CalendarDays size={12} />
            Expires: {new Date(food.expiryDate).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <span className={`w-fit rounded-full px-3 py-1.5 text-xs ${statusStyle}`}>
          {label}
        </span>
        <button
          onClick={onDelete}
          title="Delete food item"
          aria-label={`Delete ${food.name}`}
          className="rounded-lg border border-white/10 p-2 text-slate-400 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400"
        >
          <Trash2 size={17} />
        </button>
      </div>
    </div>
  );
}

export default App;
