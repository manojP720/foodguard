
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Clock3,
  Trash2,
  Leaf,
  AlertTriangle,
  CheckCircle2,
  X,
  LoaderCircle,
  RefreshCw,
  CalendarDays,
  MapPin,
  Pencil,
  Search,
  Plus,
  Sparkles,
  Bell,
  LogOut,
  Menu,
  Milk,
  Apple,
  Carrot,
  Croissant,
  Beef,
  Fish,
  Wheat,
  CupSoda,
  Snowflake,
} from "lucide-react";

import AuthPage from "./AuthPage";
import {
  getFoods,
  addFood,
  updateFood,
  deleteFood,
} from "./services/foodService";

const todayString = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

const initialForm = {
  name: "",
  category: "Vegetables",
  quantity: "1",
  unit: "pieces",
  purchaseDate: todayString(),
  expiryDate: "",
  storageLocation: "Refrigerator",
  notes: "",
};

function dateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function getExpiryInfo(expiryDate) {
  if (!expiryDate) {
    return { days: Infinity, status: "safe", label: "No expiry date" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);

  if (Number.isNaN(expiry.getTime())) {
    return { days: Infinity, status: "safe", label: "Unknown expiry" };
  }

  const days = Math.round((expiry - today) / 86400000);

  if (days < 0) {
    return {
      days,
      status: "danger",
      label: `Expired ${Math.abs(days)}d ago`,
    };
  }

  if (days === 0) {
    return { days, status: "warning", label: "Expires Today" };
  }

  if (days <= 7) {
    return { days, status: "imminent", label: `${days} days left` };
  }

  return { days, status: "safe", label: `${days} days left` };
}

const inputClass =
  "w-full rounded-2xl border border-emerald-900/70 bg-[#091E18] px-4 py-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none transition focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/15";

function FormField({ label, children }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}

function StatCard({ title, value, description, icon, type = "safe" }) {
  const styles = {
    safe: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-200",
  };

  return (
    <div className="fg-card-hover rounded-2xl border p-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {title}
        </p>
        <div className={`fg-stat-icon rounded-xl border p-3 ${styles[type]}`}>
          {icon}
        </div>
      </div>
      <p className="text-3xl font-bold tracking-tight text-slate-100">
        {value}
      </p>
      <p className="mt-2 text-xs text-slate-400">{description}</p>
    </div>
  );
}

function FoodRow({ food, onEdit, onDelete, onConsume }) {
  const { status, label } = getExpiryInfo(food.expiryDate);

  const badgeStyles = {
    danger: "border-rose-400/25 bg-rose-400/10 text-rose-200",
    warning: "border-amber-400/25 bg-amber-400/10 text-amber-200",
    imminent: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    safe: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
  };

  const categoryIcons = {
    Dairy: Milk,
    Fruits: Apple,
    Vegetables: Carrot,
    Bakery: Croissant,
    Meat: Beef,
    Seafood: Fish,
    Grains: Wheat,
    Beverages: CupSoda,
    Frozen: Snowflake,
  };
  const CategoryIcon = categoryIcons[food.category] || Package;

  return (
    <div className="fg-card-hover flex flex-col gap-4 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <div className="fg-food-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-emerald-200">
          <CategoryIcon size={25} strokeWidth={1.7} />
        </div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-100">{food.name}</p>
            <span className="rounded-md border border-emerald-900/60 bg-emerald-950/50 px-2 py-1 text-[10px] font-semibold uppercase text-slate-400">
              {food.category}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400">
            <span className="font-medium text-slate-200">
              {food.quantity} {food.unit}
            </span>
            <span className="flex items-center gap-1">
              <MapPin size={12} />
              {food.storageLocation || "Pantry"}
            </span>
            <span className="flex items-center gap-1">
              <CalendarDays size={12} />
              Exp:{" "}
              {food.expiryDate
                ? new Date(food.expiryDate).toLocaleDateString()
                : "Not set"}
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-emerald-900/40 pt-3 sm:justify-end sm:border-0 sm:pt-0">
        <span
          className={`rounded-xl border px-3 py-1.5 text-xs font-semibold ${
            badgeStyles[status] || badgeStyles.safe
          }`}
        >
          {label}
        </span>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onConsume}
            title="Mark as consumed"
            className="fg-icon-button rounded-xl border p-2.5 transition hover:text-cyan-200"
          >
            <CheckCircle2 size={16} />
          </button>

          <button
            type="button"
            onClick={onEdit}
            title="Edit food"
            className="fg-icon-button rounded-xl border p-2.5 transition"
          >
            <Pencil size={16} />
          </button>

          <button
            type="button"
            onClick={onDelete}
            title="Delete food"
            className="fg-icon-button rounded-xl border p-2.5 transition hover:text-rose-200"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ user, onLogout }) {
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [search, setSearch] = useState("");
  const [activeView, setActiveView] = useState("Dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [form, setForm] = useState(initialForm);

  async function loadFoods() {
    setLoading(true);
    setError("");

    try {
      const data = await getFoods();
      setFoods(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err.message ||
          "Could not load food items. Check that the backend is running."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFoods();
  }, []);

  const activeFoods = useMemo(
    () => foods.filter((food) => !food.consumed),
    [foods]
  );

  const stats = useMemo(() => {
    const expiring = activeFoods.filter((food) => {
      const days = getExpiryInfo(food.expiryDate).days;
      return days >= 0 && days <= 7;
    });

    const expired = activeFoods.filter(
      (food) => getExpiryInfo(food.expiryDate).days < 0
    );

    return {
      total: activeFoods.length,
      expiring: expiring.length,
      expired: expired.length,
      consumed: foods.filter((food) => food.consumed).length,
    };
  }, [foods, activeFoods]);

  const expiryReminders = useMemo(
    () =>
      activeFoods
        .filter((food) => food.expiryDate)
        .map((food) => ({
          ...food,
          expiryInfo: getExpiryInfo(food.expiryDate),
        }))
        .filter((food) => food.expiryInfo.days <= 7)
        .sort((a, b) => a.expiryInfo.days - b.expiryInfo.days),
    [activeFoods]
  );

  const filteredFoods = useMemo(() => {
    const query = search.trim().toLowerCase();

    let result = foods.filter((food) => {
      const matchesSearch =
        (food.name || "").toLowerCase().includes(query) ||
        (food.category || "").toLowerCase().includes(query);

      if (activeView === "Consumed") {
        return food.consumed && matchesSearch;
      }

      return !food.consumed && matchesSearch;
    });

    if (activeView === "Expiring Soon") {
      result = result.filter((food) => {
        const days = getExpiryInfo(food.expiryDate).days;
        return days >= 0 && days <= 7;
      });
    } else if (activeView === "Food Waste") {
      result = result.filter(
        (food) => getExpiryInfo(food.expiryDate).days < 0
      );
    }

    return result.sort(
      (a, b) =>
        new Date(a.expiryDate || "9999-12-31") -
        new Date(b.expiryDate || "9999-12-31")
    );
  }, [foods, search, activeView]);

  function openAddModal() {
    setError("");
    setNotice("");
    setEditingFood(null);
    setForm({ ...initialForm, purchaseDate: todayString() });
    setShowModal(true);
  }

  function handleEditFood(food) {
    setError("");
    setNotice("");
    setEditingFood(food);

    setForm({
      name: food.name || "",
      category: food.category || "Other",
      quantity: String(food.quantity ?? 1),
      unit: food.unit || "pieces",
      purchaseDate: dateInputValue(food.purchaseDate) || todayString(),
      expiryDate: dateInputValue(food.expiryDate),
      storageLocation: food.storageLocation || "Refrigerator",
      notes: food.notes || "",
    });

    setShowModal(true);
  }

  async function handleSaveFood(event) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (!form.name.trim()) {
      setError("Please enter the food name.");
      return;
    }

    if (!form.expiryDate) {
      setError("Please select an expiry date.");
      return;
    }

    const quantity = Number(form.quantity);

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    const payload = {
      ...form,
      name: form.name.trim(),
      quantity,
      consumed: editingFood ? Boolean(editingFood.consumed) : false,
    };

    setSaving(true);

    try {
      if (editingFood) {
        await updateFood(editingFood._id, payload);
        setNotice("Food item updated successfully.");
      } else {
        await addFood(payload);
        setNotice("Food item added successfully.");
      }

      setShowModal(false);
      setEditingFood(null);
      setForm(initialForm);
      await loadFoods();
    } catch (err) {
      setError(err.message || "Could not save the food item.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteFood(food) {
    const confirmed = window.confirm(
      `Delete "${food.name}" from your inventory?`
    );

    if (!confirmed) return;

    setError("");
    setNotice("");

    try {
      await deleteFood(food._id);
      setFoods((current) =>
        current.filter((item) => item._id !== food._id)
      );
      setNotice(`${food.name} deleted successfully.`);
    } catch (err) {
      setError(err.message || "Could not delete the food item.");
    }
  }

  async function handleConsumeFood(food) {
    setError("");
    setNotice("");

    try {
      await updateFood(food._id, { consumed: true });

      setFoods((current) =>
        current.map((item) =>
          item._id === food._id ? { ...item, consumed: true } : item
        )
      );

      setNotice(`${food.name} marked as consumed.`);
    } catch (err) {
      setError(err.message || "Could not update the food item.");
    }
  }

  const navigation = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "Expiring Soon", icon: Clock3 },
    { name: "Food Waste", icon: Trash2 },
    { name: "Consumed", icon: CheckCircle2 },
  ];

  return (
    <div className="fg-app-shell relative isolate min-h-screen overflow-x-hidden bg-[#061712] text-slate-100">
      <style>{`
        .fg-app-shell::before { content: ""; position: fixed; inset: 0; z-index: -1; pointer-events: none; background: radial-gradient(ellipse at 75% 0%, rgba(16,185,129,.12), transparent 38%), radial-gradient(ellipse at 8% 52%, rgba(20,184,166,.07), transparent 34%), linear-gradient(135deg, #061712 0%, #071c16 52%, #081a16 100%); }
        .fg-glass-sidebar { background: rgba(5, 25, 19, .92); backdrop-filter: blur(24px); box-shadow: 18px 0 60px rgba(0,0,0,.20); }
        .fg-glass-header { background: rgba(6, 23, 18, .84); backdrop-filter: blur(24px); box-shadow: 0 10px 35px rgba(0,0,0,.09); }
        .fg-card-hover { background: linear-gradient(145deg, rgba(14, 43, 33, .96), rgba(8, 30, 23, .98)); border-color: rgba(52, 211, 153, .15); box-shadow: 0 12px 34px rgba(0,0,0,.16), inset 0 1px 0 rgba(255,255,255,.025); transition: transform .24s ease, border-color .24s ease, box-shadow .24s ease; }
        .fg-card-hover:hover { transform: translateY(-3px); border-color: rgba(52, 211, 153, .38); box-shadow: 0 16px 42px rgba(0,0,0,.24), 0 0 24px rgba(16,185,129,.07); }
        .fg-logo-glow { background: linear-gradient(140deg, #34d399, #059669 60%, #0f766e) !important; box-shadow: 0 0 0 1px rgba(167,243,208,.25), 0 0 24px rgba(16,185,129,.30), inset 0 1px 0 rgba(255,255,255,.24); }
        .fg-primary-button { background: linear-gradient(105deg, #059669 0%, #10b981 48%, #0d9488 100%) !important; border: 1px solid rgba(167,243,208,.24); box-shadow: 0 8px 22px rgba(16,185,129,.18), inset 0 1px 0 rgba(255,255,255,.16); transition: transform .2s ease, box-shadow .2s ease, filter .2s ease; }
        .fg-primary-button:hover { filter: brightness(1.08); transform: translateY(-1px); box-shadow: 0 11px 30px rgba(16,185,129,.27), 0 0 22px rgba(16,185,129,.12); }
        .fg-primary-button:active { transform: translateY(0) scale(.99); }
        .fg-icon-button { background: rgba(12, 40, 30, .88); border-color: rgba(52,211,153,.18); color: #a7f3d0; transition: border-color .2s ease, box-shadow .2s ease, background .2s ease; }
        .fg-icon-button:hover { background: rgba(16,185,129,.12); border-color: rgba(52,211,153,.42); box-shadow: 0 0 18px rgba(16,185,129,.12); }
        .fg-nav-active { background: linear-gradient(100deg, rgba(16,185,129,.18), rgba(13,148,136,.08)); color: #a7f3d0; border: 1px solid rgba(52,211,153,.21); box-shadow: inset 0 1px 0 rgba(255,255,255,.035), 0 0 22px rgba(16,185,129,.07); }
        .fg-panel { background: linear-gradient(145deg, rgba(13, 38, 29, .98), rgba(7, 26, 20, .98)); border: 1px solid rgba(52,211,153,.16); box-shadow: 0 18px 48px rgba(0,0,0,.20), inset 0 1px 0 rgba(255,255,255,.025); }
        .fg-food-icon { background: radial-gradient(circle at 30% 20%, rgba(52,211,153,.22), rgba(16,185,129,.055) 72%); color: #6ee7b7; border: 1px solid rgba(52,211,153,.20); box-shadow: inset 0 1px 0 rgba(255,255,255,.04), 0 0 18px rgba(16,185,129,.06); }
        .fg-stat-icon { box-shadow: 0 0 22px rgba(16,185,129,.07); }
        .fg-soft-glow { animation: fgGlowPulse 3.8s ease-in-out infinite; }
        @keyframes fgGlowPulse { 0%,100% { box-shadow: 0 0 18px rgba(16,185,129,.20), inset 0 1px 0 rgba(255,255,255,.14); } 50% { box-shadow: 0 0 29px rgba(16,185,129,.34), inset 0 1px 0 rgba(255,255,255,.20); } }
        @media (prefers-reduced-motion: reduce) { .fg-soft-glow { animation: none; } .fg-card-hover, .fg-primary-button, .fg-icon-button { transition: none; } }
      `}</style>
      <div aria-hidden="true" className="pointer-events-none fixed -right-24 -top-28 z-0 h-80 w-80 rounded-full bg-emerald-400/[0.07] blur-3xl" />
      <div aria-hidden="true" className="pointer-events-none fixed -bottom-28 left-[30%] z-0 h-72 w-72 rounded-full bg-teal-400/[0.05] blur-3xl" />
      {sidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 z-30 bg-slate-950/30 md:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-emerald-900/50 fg-glass-sidebar transition-transform duration-200 md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-20 items-center gap-3 border-b border-emerald-900/40 px-6">
          <div className="fg-logo-glow fg-soft-glow flex h-11 w-11 items-center justify-center rounded-2xl text-white">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-100">
              FoodGuard
            </h1>
            <p className="text-xs text-slate-400">Waste less. Save more.</p>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            className="ml-auto rounded-lg p-2 text-slate-300 transition hover:bg-emerald-900/40 md:hidden"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 py-6">
          <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-widest text-slate-500">
            Workspace
          </p>

          <nav className="space-y-1">
            {navigation.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => {
                  setActiveView(name);
                  setSidebarOpen(false);
                  setError("");
                }}
                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition ${
                  activeView === name
                    ? "fg-nav-active"
                    : "border-transparent text-slate-400 hover:bg-emerald-950/50 hover:text-slate-100"
                }`}
              >
                <Icon size={18} />
                {name}
                {name === "Expiring Soon" && stats.expiring > 0 && (
                  <span className="ml-auto rounded-full bg-amber-400/15 px-2 py-0.5 text-xs text-amber-200">
                    {stats.expiring}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
            <div className="mb-2 flex items-center gap-2 text-emerald-300">
              <Sparkles size={17} />
              <span className="text-sm font-semibold">FoodGuard tip</span>
            </div>
            <p className="text-xs leading-5 text-emerald-200">
              Use food that expires first before opening newer items.
            </p>
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="mt-4 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-slate-400 transition hover:bg-rose-400/10 hover:text-rose-200"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>

      <main className="min-h-screen md:ml-64">
        <header className="sticky top-0 z-20 flex h-20 items-center justify-between border-b border-emerald-900/50 fg-glass-header px-4 backdrop-blur-xl sm:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="fg-icon-button rounded-xl border p-2 md:hidden"
              aria-label="Open menu"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-bold text-slate-100 sm:text-xl">
                {activeView}
              </h2>
              <p className="hidden text-xs text-slate-400 sm:block">
                Manage your food inventory smartly.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setShowNotifications((value) => !value)}
              className={`fg-icon-button relative rounded-xl border p-2.5 transition ${expiryReminders.length ? "fg-soft-glow" : ""}`}
              aria-label="Expiry notifications"
            >
              <Bell size={19} />
              {expiryReminders.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-400/100 px-1 text-[10px] font-bold text-white">
                  {expiryReminders.length}
                </span>
              )}
            </button>

            <div className="hidden text-right sm:block">
              <p className="max-w-36 truncate text-sm font-semibold text-slate-200">
                {user?.name || user?.email || "FoodGuard User"}
              </p>
              <p className="text-xs text-slate-400">Your inventory</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/10 font-bold text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.10)]">
              {(user?.name || user?.email || "F").charAt(0).toUpperCase()}
            </div>
          </div>

          {showNotifications && (
            <div className="absolute right-4 top-16 z-50 w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-emerald-900/60 bg-[#0B211B] p-4 shadow-xl sm:right-8">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-100">
                  Expiry reminders
                </h3>
                <button
                  type="button"
                  onClick={() => setShowNotifications(false)}
                  aria-label="Close notifications"
                  className="rounded-lg p-1 text-slate-400 hover:bg-emerald-950/50"
                >
                  <X size={17} />
                </button>
              </div>

              {expiryReminders.length === 0 ? (
                <p className="py-4 text-sm text-slate-400">
                  No upcoming expiry reminders.
                </p>
              ) : (
                <div className="max-h-72 space-y-2 overflow-y-auto">
                  {expiryReminders.map((food) => (
                    <div
                      key={food._id}
                      className="rounded-xl border border-emerald-900/40 bg-[#081C16] p-3"
                    >
                      <p className="text-sm font-semibold text-slate-200">
                        {food.name}
                      </p>
                      <p className="mt-1 text-xs text-rose-300">
                        {food.expiryInfo.label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </header>

        <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <p className="text-sm text-slate-400">
                Welcome back{user?.name ? `, ${user.name}` : ""} 👋
              </p>
              <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-100 sm:text-3xl">
                Let's reduce food waste.
              </h1>
              <p className="mt-2 text-sm text-slate-400">
                Keep track of your food and expiry dates in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadFoods}
                disabled={loading}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-900/60 bg-[#0B211B] px-4 py-3 text-sm font-semibold text-slate-300 transition hover:bg-emerald-950/50 disabled:opacity-50"
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 fg-primary-button rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                <Plus size={17} />
                Add food
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 p-4 text-sm text-rose-200">
              <AlertTriangle size={19} className="mt-0.5 shrink-0" />
              <div className="flex-1">{error}</div>
              <button
                type="button"
                onClick={() => setError("")}
                aria-label="Dismiss error"
              >
                <X size={17} />
              </button>
            </div>
          )}

          {notice && (
            <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/25 bg-emerald-400/10 p-4 text-sm text-emerald-200">
              <CheckCircle2 size={19} />
              <span className="flex-1">{notice}</span>
              <button
                type="button"
                onClick={() => setNotice("")}
                aria-label="Dismiss message"
              >
                <X size={17} />
              </button>
            </div>
          )}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Active food items"
              value={stats.total}
              description="Items in your inventory"
              icon={<Package size={21} />}
            />
            <StatCard
              title="Expiring soon"
              value={stats.expiring}
              description="Expiring within 7 days"
              type="warning"
              icon={<Clock3 size={21} />}
            />
            <StatCard
              title="Expired items"
              value={stats.expired}
              description="Need your attention"
              type="danger"
              icon={<AlertTriangle size={21} />}
            />
            <StatCard
              title="Items consumed"
              value={stats.consumed}
              description="Food marked as consumed"
              icon={<CheckCircle2 size={21} />}
            />
          </section>

          <section className="fg-panel rounded-2xl p-4 sm:p-6">
            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-lg font-bold text-slate-100">
                  {activeView === "Dashboard"
                    ? "Food inventory"
                    : activeView}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {filteredFoods.length} item
                  {filteredFoods.length === 1 ? "" : "s"} found
                </p>
              </div>

              <div className="relative w-full sm:max-w-xs">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search food or category..."
                  className="w-full rounded-xl border border-emerald-900/60 bg-[#081C16] py-3 pl-10 pr-4 text-sm outline-none transition focus:border-emerald-500 focus:bg-[#0B211B]"
                />
              </div>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-slate-400">
                <LoaderCircle
                  size={30}
                  className="animate-spin text-emerald-600"
                />
                <p className="text-sm">Loading your food inventory...</p>
              </div>
            ) : filteredFoods.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-900/60 bg-[#081C16] px-5 py-14 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
                  <Package size={26} />
                </div>
                <h4 className="font-semibold text-slate-100">
                  {activeView === "Consumed"
                    ? "No consumed items yet"
                    : search
                      ? "No matching food found"
                      : "Your inventory is empty"}
                </h4>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  {search
                    ? "Try another food name or category."
                    : "Add your first food item to start tracking expiry dates."}
                </p>
                {!search && activeView !== "Consumed" && (
                  <button
                    type="button"
                    onClick={openAddModal}
                    className="mt-5 flex items-center gap-2 fg-primary-button rounded-xl px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                  >
                    <Plus size={16} />
                    Add your first food
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredFoods.map((food) => (
                  <FoodRow
                    key={food._id}
                    food={food}
                    onEdit={() => handleEditFood(food)}
                    onDelete={() => handleDeleteFood(food)}
                    onConsume={() => handleConsumeFood(food)}
                  />
                ))}
              </div>
            )}
          </section>

          <footer className="flex flex-col justify-between gap-2 pb-2 text-xs text-slate-500 sm:flex-row">
            <p>FoodGuard — Waste less. Save more.</p>
            <p>Helping you manage food responsibly 🌱</p>
          </footer>
        </div>
      </main>

      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving) {
              setShowModal(false);
            }
          }}
        >
          <div className="fg-panel my-auto w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl">
            <div className="flex items-center justify-between border-b border-emerald-900/40 px-5 py-5 sm:px-7">
              <div>
                <h3 className="text-xl font-bold text-slate-100">
                  {editingFood ? "Edit food item" : "Add food item"}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  Enter the details of your food.
                </p>
              </div>

              <button
                type="button"
                disabled={saving}
                onClick={() => setShowModal(false)}
                aria-label="Close form"
                className="rounded-xl border border-emerald-900/60 p-2 text-slate-400 hover:bg-[#081C16]"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSaveFood} className="space-y-5 p-5 sm:p-7">
              {error && (
                <div className="rounded-xl border border-rose-400/25 bg-rose-400/10 p-3 text-sm text-rose-200">
                  {error}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <FormField label="Food name *">
                  <input
                    required
                    maxLength={100}
                    className={inputClass}
                    placeholder="e.g. Tomatoes"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                  />
                </FormField>

                <FormField label="Category *">
                  <select
                    required
                    className={inputClass}
                    value={form.category}
                    onChange={(event) =>
                      setForm({ ...form, category: event.target.value })
                    }
                  >
                    {[
                      "Vegetables",
                      "Fruits",
                      "Dairy",
                      "Bakery",
                      "Meat",
                      "Seafood",
                      "Grains",
                      "Beverages",
                      "Frozen",
                      "Other",
                    ].map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Quantity *">
                  <input
                    required
                    type="number"
                    min="0.01"
                    step="any"
                    className={inputClass}
                    value={form.quantity}
                    onChange={(event) =>
                      setForm({ ...form, quantity: event.target.value })
                    }
                  />
                </FormField>

                <FormField label="Unit *">
                  <select
                    required
                    className={inputClass}
                    value={form.unit}
                    onChange={(event) =>
                      setForm({ ...form, unit: event.target.value })
                    }
                  >
                    {[
                      "pieces",
                      "kg",
                      "g",
                      "litres",
                      "ml",
                      "packets",
                      "dozen",
                    ].map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Purchase date">
                  <input
                    type="date"
                    className={inputClass}
                    value={form.purchaseDate}
                    onChange={(event) =>
                      setForm({ ...form, purchaseDate: event.target.value })
                    }
                  />
                </FormField>

                <FormField label="Expiry date *">
                  <input
                    required
                    type="date"
                    className={inputClass}
                    value={form.expiryDate}
                    onChange={(event) =>
                      setForm({ ...form, expiryDate: event.target.value })
                    }
                  />
                </FormField>

                <FormField label="Storage location">
                  <select
                    className={inputClass}
                    value={form.storageLocation}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        storageLocation: event.target.value,
                      })
                    }
                  >
                    {[
                      "Refrigerator",
                      "Freezer",
                      "Pantry",
                      "Kitchen shelf",
                      "Other",
                    ].map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                  </select>
                </FormField>

                <FormField label="Notes">
                  <input
                    maxLength={500}
                    className={inputClass}
                    placeholder="Optional notes"
                    value={form.notes}
                    onChange={(event) =>
                      setForm({ ...form, notes: event.target.value })
                    }
                  />
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-emerald-900/40 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => setShowModal(false)}
                  className="rounded-xl border border-emerald-900/60 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-[#081C16] disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center justify-center gap-2 fg-primary-button rounded-xl px-5 py-3 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
                >
                  {saving && <LoaderCircle size={16} className="animate-spin" />}
                  {saving
                    ? "Saving..."
                    : editingFood
                      ? "Save changes"
                      : "Add food"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [session, setSession] = useState(() => {
    try {
      const token = sessionStorage.getItem("foodguard_token");
      const savedUser = sessionStorage.getItem("foodguard_user");

      if (!token || !savedUser) return null;

      return {
        token,
        user: JSON.parse(savedUser),
      };
    } catch {
      sessionStorage.removeItem("foodguard_token");
      sessionStorage.removeItem("foodguard_user");
      return null;
    }
  });

  function handleLogin(result) {
    const token = result?.token;
    const user = result?.user;

    if (!token || !user) {
      throw new Error("Login response did not contain a token and user.");
    }

    sessionStorage.setItem("foodguard_token", token);
    sessionStorage.setItem("foodguard_user", JSON.stringify(user));

    setSession({ token, user });
  }

  function handleLogout() {
    sessionStorage.removeItem("foodguard_token");
    sessionStorage.removeItem("foodguard_user");
    setSession(null);
  }

  useEffect(() => {
    const handleExpiredSession = () => {
      handleLogout();
    };

    window.addEventListener("foodguard:logout", handleExpiredSession);

    return () => {
      window.removeEventListener("foodguard:logout", handleExpiredSession);
    };
  }, []);

  if (!session) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={session.user}
      onLogout={handleLogout}
    />
  );
}
