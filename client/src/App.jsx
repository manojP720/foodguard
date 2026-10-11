import { useEffect, useMemo, useState } from "react";

import {

  LayoutDashboard, Package, Clock3, Trash2, Leaf, AlertTriangle, 

  CheckCircle2, X, LoaderCircle, RefreshCw, CalendarDays, MapPin, 

  Pencil, Search, Plus, Sparkles, ChevronRight, HelpCircle, Bell

} from "lucide-react";

import { getFoods, addFood, updateFood, deleteFood } from "./services/foodService";



const todayString = () => {

  const date = new Date();

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 10);

};



const initialForm = {

  name: "", category: "Vegetables", quantity: "1", unit: "pieces",

  purchaseDate: todayString(), expiryDate: "", storageLocation: "Refrigerator", notes: "",

};



function dateInputValue(value) {

  if (!value) return "";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "";

  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());

  return date.toISOString().slice(0, 10);

}



function getExpiryInfo(expiryDate) {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  const expiry = new Date(expiryDate);

  expiry.setHours(0, 0, 0, 0);

  const days = Math.round((expiry - today) / 86400000);

  if (days < 0) return { days, status: "danger", label: `Expired ${Math.abs(days)}d ago` };

  if (days === 0) return { days, status: "warning", label: "Expires Today" };

  if (days <= 7) return { days, status: "imminent", label: `${days} days left` };

  return { days, status: "safe", label: `${days} days left` };

}



const inputClass = "w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-all duration-200 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 placeholder:text-slate-400 shadow-sm";



function FormField({ label, children }) {

  return (

    <div className="space-y-2">

      <span className="text-xs font-semibold tracking-wider text-slate-500 uppercase">{label}</span>

      {children}

    </div>

  );

}



function StatCard({ title, value, description, icon, type }) {

  const variants = {

    safe: { ring: "border-emerald-500/30 text-emerald-700 bg-emerald-50", glow: "from-emerald-500/20 to-transparent" },

    warning: { ring: "border-amber-500/30 text-amber-700 bg-amber-50", glow: "from-amber-500/20 to-transparent" },

    danger: { ring: "border-rose-500/30 text-rose-700 bg-rose-50", glow: "from-rose-500/20 to-transparent" }

  };

  const style = variants[type] || variants.safe;



  return (

    <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 sm:rounded-2xl sm:p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-md group">

      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${style.glow} blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="flex items-center justify-between mb-6">

        <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{title}</p>

        <div className={`rounded-2xl border p-3 backdrop-blur-md ${style.ring}`}>{icon}</div>

      </div>

      <p className="text-3xl font-bold tracking-tight text-slate-900">{value}</p>

      <p className="mt-2 text-xs font-medium text-slate-500 flex items-center gap-1.5">

        <span className="h-1 w-1 rounded-full bg-current opacity-70" />

        {description}

      </p>

    </div>

  );

}



function FoodRow({ food, onEdit, onDelete, onConsume }) {

  const { status, label } = getExpiryInfo(food.expiryDate);



  const badgeConfig = {

    danger: "bg-rose-50 text-rose-700 border-rose-200 ring-rose-100",

    warning: "bg-amber-50 text-amber-700 border-amber-200 ring-amber-100",

    imminent: "bg-cyan-50 text-cyan-700 border-cyan-200 ring-cyan-100",

    safe: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100"

  };



  const emojiByCategory = { 

    Dairy: "🥛", Fruits: "🍎", Vegetables: "🥦", Bakery: "🍞", 

    Meat: "🥩", Seafood: "🐟", Grains: "🌾", Beverages: "🧃", Frozen: "🧊" 

  };



  return (

    <div className="group relative overflow-hidden flex flex-col gap-4 rounded-2xl border border-slate-200/80 bg-white p-4 sm:flex-row sm:items-center sm:justify-between shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md">

      <div className="flex min-w-0 items-center gap-4">

        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-100 text-2xl group-hover:scale-105 transition-transform duration-200">

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {emojiByCategory[food.category] || "📦"}

        </div>

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <p className="truncate font-semibold text-slate-900 tracking-tight group-hover:text-emerald-700 transition-colors">{food.name}</p>

            <span className="text-[10px] font-semibold tracking-wide uppercase px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-400">{food.category}</span>

          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-500">

            <span className="text-slate-700">{food.quantity} {food.unit}</span>

            <span className="text-slate-400">•</span>

            <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-500" />{food.storageLocation || "Pantry"}</span>

            <span className="text-slate-400">•</span>

            <span className="flex items-center gap-1"><CalendarDays size={12} className="text-slate-500" />Exp: {new Date(food.expiryDate).toLocaleDateString()}</span>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3 sm:border-0 sm:pt-0 sm:justify-end">

        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ring-1 ${badgeConfig[status] || badgeConfig.safe}`}>

          <span className="relative flex h-1.5 w-1.5">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-70" />

            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />

          </span>

          {label}

        </span>

        <div className="flex items-center gap-2">

          <button type="button" onClick={onConsume} title="Mark as consumed" aria-label={`Mark ${food.name} as consumed`} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 transition-all duration-200 hover:border-cyan-500/30 hover:bg-cyan-50 hover:text-cyan-700"><CheckCircle2 size={15} /></button>

          <button type="button" onClick={onEdit} title="Edit food item" aria-label={`Edit ${food.name}`} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-50 hover:text-emerald-700"><Pencil size={15} /></button>

          <button type="button" onClick={onDelete} title="Delete food item" aria-label={`Delete ${food.name}`} className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-500 transition-all duration-200 hover:border-rose-500/30 hover:bg-rose-50 hover:text-rose-700"><Trash2 size={15} /></button>

        </div>

      </div>

    </div>

  );

}



function App() {

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

  const [form, setForm] = useState(initialForm);



  async function loadFoods() {

    setLoading(true);

    setError("");

    try {

      const data = await getFoods();

      setFoods(Array.isArray(data) ? data : []);

    } catch (err) {

      setError(err.message || "Could not load food items. Check that the backend is running.");

    } finally {

      setLoading(false);

    }

  }



  useEffect(() => { loadFoods(); }, []);



  const stats = useMemo(() => {

    const activeFoods = foods.filter((food) => !food.consumed);

    const expiring = activeFoods.filter((food) => { const { days } = getExpiryInfo(food.expiryDate); return days >= 0 && days <= 7; });

    const expired = activeFoods.filter((food) => getExpiryInfo(food.expiryDate).days < 0);

    return { total: activeFoods.length, expiring: expiring.length, expired: expired.length, consumed: foods.filter((food) => food.consumed).length };

  }, [foods]);

  // In-app expiry reminders: active items expiring within 7 days, plus expired items.
  const expiryReminders = useMemo(() => {
    return foods
      .filter((food) => !food.consumed && food.expiryDate)
      .map((food) => ({ ...food, expiryInfo: getExpiryInfo(food.expiryDate) }))
      .filter((food) => food.expiryInfo.days <= 7)
      .sort((a, b) => a.expiryInfo.days - b.expiryInfo.days);
  }, [foods]);

  const reminderCount = expiryReminders.length;

  const filteredFoods = useMemo(() => {

    let result = foods.filter((food) => {

      const query = search.trim().toLowerCase();

      return (food.name || "").toLowerCase().includes(query) || (food.category || "").toLowerCase().includes(query);

    });

    if (activeView === "Expiring Soon") result = result.filter((food) => !food.consumed && getExpiryInfo(food.expiryDate).days >= 0 && getExpiryInfo(food.expiryDate).days <= 7);

    else if (activeView === "Food Waste") result = result.filter((food) => !food.consumed && getExpiryInfo(food.expiryDate).days < 0);

    else result = result.filter((food) => !food.consumed);

    return result.sort((a, b) => new Date(a.expiryDate) - new Date(b.expiryDate));

  }, [foods, search, activeView]);



  function openAddModal() {

    setError(""); setNotice(""); setEditingFood(null);

    setForm({ ...initialForm, purchaseDate: todayString() });

    setShowModal(true);

  }



  function handleEditFood(food) {

    setError(""); setNotice(""); setEditingFood(food);

    setForm({

      name: food.name || "", category: food.category || "Other", quantity: String(food.quantity ?? 1),

      unit: food.unit || "pieces", purchaseDate: dateInputValue(food.purchaseDate) || todayString(),

      expiryDate: dateInputValue(food.expiryDate), storageLocation: food.storageLocation || "Refrigerator", notes: food.notes || "",

    });

    setShowModal(true);

  }



  async function handleSaveFood(event) {

    event.preventDefault(); setError(""); setNotice("");

    if (new Date(form.expiryDate) < new Date(form.purchaseDate)) { setError("Expiry date cannot be earlier than the purchase date."); return; }

    setSaving(true);

    try {

      const foodData = { ...form, quantity: Number(form.quantity) };

      if (editingFood) await updateFood(editingFood._id, foodData);

      else await addFood(foodData);

      const wasEditing = Boolean(editingFood);

      setForm({ ...initialForm, purchaseDate: todayString() });

      setShowModal(false); setEditingFood(null);

      setNotice(wasEditing ? "Food item updated successfully." : "Food item added successfully.");

      await loadFoods();

    } catch (err) {

      setError(err.message || (editingFood ? "Could not save changes." : "Could not add food item."));

    } finally {

      setSaving(false);

    }

  }



  async function handleConsumeFood(food) {
    if (!window.confirm(`Mark ${food.name} as consumed?`)) return;
    setError(""); setNotice("");
    try {
      await updateFood(food._id, { consumed: true });
      setNotice(`${food.name} marked as consumed. Nice work reducing food waste!`);
      await loadFoods();
    } catch (err) {
      setError(err.message || "Could not mark this food as consumed.");
    }
  }

  async function handleDeleteFood(id) {

    if (!window.confirm("Delete this food item?")) return;

    setError(""); setNotice("");

    try {

      await deleteFood(id);

      setNotice("Food item deleted.");

      await loadFoods();

    } catch (err) {

      setError(err.message || "Could not delete food item.");

    }

  }



  return (

    <div className="relative min-h-screen bg-[#f6f8f5] text-slate-800 font-sans antialiased overflow-x-hidden">

      {/* Soft background accents */}

      



      <div className="relative z-10 flex min-h-screen">

        {/* Primary navigation */}

        <aside className="hidden w-72 border-r border-slate-200/80 bg-white p-6 shadow-sm md:flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-3 px-2 mb-10 group">

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-600 shadow-sm transition-transform duration-500 group-hover:rotate-12">

                <Leaf className="text-white h-5 w-5 fill-white" />

              </div>

              <div>

                <span className="text-lg font-extrabold tracking-tight text-slate-900 uppercase block">FoodGuard</span>

                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.16em] block -mt-0.5">Food Inventory</span>

              </div>

            </div>



            <nav className="space-y-1.5">

              {[

                { id: "Dashboard", icon: <LayoutDashboard size={18} /> },

                { id: "Inventory", icon: <Package size={18} /> },

                { id: "Expiring Soon", icon: <Clock3 size={18} /> },

                { id: "Food Waste", icon: <Trash2 size={18} /> },

              ].map((item) => (

                <button

                  key={item.id}

                  onClick={() => setActiveView(item.id)}

                  className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group ${

                    activeView === item.id

                      ? "bg-emerald-50 text-emerald-800 border-l-2 border-emerald-600 px-5"

                      : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"

                  }`}

                >

                  <div className="flex items-center gap-3.5">

                    {item.icon}

                    <span>{item.id}</span>

                  </div>

                  <ChevronRight size={14} className={`opacity-0 -translate-x-2 transition-all duration-300 ${activeView === item.id ? "opacity-100 translate-x-0" : "group-hover:opacity-40"}`} />

                </button>

              ))}

            </nav>

          </div>



          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">

            <div className="flex items-center gap-3">

              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

              <p className="text-xs font-semibold tracking-wide text-slate-700">Your inventory is ready</p>

            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-1">Everything you have, in one place</p>

          </div>

        </aside>



        {/* Primary Workspace */}

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10 max-w-[1600px] mx-auto w-full">
          <nav aria-label="Main navigation" className="mb-6 grid grid-cols-4 gap-2 md:hidden">
            {[
              { id: "Dashboard", icon: <LayoutDashboard size={16} /> },
              { id: "Inventory", icon: <Package size={16} /> },
              { id: "Expiring Soon", icon: <Clock3 size={16} /> },
              { id: "Food Waste", icon: <Trash2 size={16} /> },
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-colors ${activeView === item.id ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-white text-slate-400 hover:bg-slate-50"}`}>
                {item.icon}<span>{item.id}</span>
              </button>
            ))}
          </nav>

          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-10">

            <div>

              <div className="flex items-center gap-2 text-xs font-bold tracking-[0.16em] text-emerald-700 uppercase mb-2">

                <Sparkles size={12} /> YOUR KITCHEN, ORGANIZED

              </div>

              <h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{activeView}</h1>

              <p className="text-sm text-slate-400 mt-2">Keep track of what you have and use it before it expires.</p>

            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowNotifications((open) => !open)}
                  aria-label={`Expiry notifications${reminderCount ? `, ${reminderCount} alerts` : ""}`}
                  title="Expiry reminders"
                  className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  <Bell size={19} />
                  {reminderCount > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{reminderCount > 99 ? "99+" : reminderCount}</span>}
                </button>
                {showNotifications && (
                  <div className="absolute right-0 z-40 mt-3 w-[min(88vw,360px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                      <div><p className="text-sm font-bold text-slate-900">Expiry reminders</p><p className="mt-0.5 text-xs text-slate-500">Items needing your attention</p></div>
                      <button type="button" onClick={() => setShowNotifications(false)} aria-label="Close reminders" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
                    </div>
                    <div className="max-h-80 overflow-y-auto p-2">
                      {expiryReminders.length === 0 ? (
                        <div className="px-4 py-8 text-center"><CheckCircle2 className="mx-auto mb-2 text-emerald-600" size={25} /><p className="text-sm font-semibold text-slate-800">You’re all caught up</p><p className="mt-1 text-xs text-slate-500">No expired or soon-to-expire items.</p></div>
                      ) : expiryReminders.map((food) => {
                        const expired = food.expiryInfo.days < 0;
                        return (
                          <button key={food._id} type="button" onClick={() => { setActiveView(expired ? "Food Waste" : "Expiring Soon"); setShowNotifications(false); }} className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-slate-50">
                            <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${expired ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-700"}`}><AlertTriangle size={17} /></span>
                            <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold text-slate-800">{food.name}</span><span className="mt-0.5 block text-xs text-slate-500">{food.quantity} {food.unit} · {food.expiryInfo.label}</span></span>
                            <ChevronRight size={16} className="mt-1 shrink-0 text-slate-400" />
                          </button>
                        );
                      })}
                    </div>
                    {reminderCount > 0 && <button type="button" onClick={() => { setActiveView("Expiring Soon"); setShowNotifications(false); }} className="w-full border-t border-slate-100 px-4 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">View expiring items</button>}
                  </div>
                )}
              </div>
              <button
                onClick={openAddModal}
                className="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98]"
              >
                <Plus size={16} strokeWidth={3} /> Add food item
              </button>
            </div>

          </header>



          {/* Status messages */}

          {notice && (

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 shadow-sm">

              <div className="flex items-center gap-3">

                <CheckCircle2 size={18} />

                <span className="font-medium tracking-wide">{notice}</span>

              </div>

              <button onClick={() => setNotice("")} className="text-emerald-700 hover:text-emerald-900 p-1.5 rounded-xl hover:bg-emerald-100 transition-all">

                <X size={16} />

              </button>

            </div>

          )}



          {error && (

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">

              <div className="flex items-center gap-3">

                <AlertTriangle size={18} />

                <span className="font-medium tracking-wide">{error}</span>

              </div>

              <button onClick={() => setError("")} className="text-rose-600 hover:text-rose-800 p-1.5 rounded-xl hover:bg-rose-100 transition-all">

                <X size={16} />

              </button>

            </div>

          )}



          {/* Inventory overview */}

          <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard title="Total items" value={stats.total} description="Food items you are tracking" icon={<Package size={18} />} type="safe" />

            <StatCard title="Expiring soon" value={stats.expiring} description="Expiry within the next 7 days" icon={<Clock3 size={18} />} type="warning" />

            <StatCard title="Expired" value={stats.expired} description="Items past their expiry date" icon={<Trash2 size={18} />} type="danger" />

            <StatCard title="Consumed" value={stats.consumed} description="Items marked as consumed" icon={<CheckCircle2 size={18} />} type="safe" />

          </section>



          {/* Search and refresh */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="relative flex-1 group">

              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-700" />

              <input

                type="text"

                placeholder="Search food by name or category..."

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all duration-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"

              />

            </div>

            <button

              onClick={loadFoods}

              disabled={loading}

              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-500 transition-all duration-200 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-40"

            >

              <RefreshCw size={16} className={loading ? "animate-spin text-emerald-700" : ""} />

            </button>

          </div>



          {/* Food inventory list */}

          <section className="space-y-3">

            {loading ? (

              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">

                <LoaderCircle className="animate-spin text-emerald-700" size={36} />

                <p className="text-sm font-semibold tracking-wider uppercase text-slate-400 animate-pulse">Loading your inventory...</p>

              </div>

            ) : filteredFoods.length === 0 ? (

              <div className="text-center py-20 rounded-2xl border border-dashed border-slate-300 bg-white">

                <Package className="mx-auto text-slate-300 mb-4" size={48} />

                <p className="text-slate-800 font-semibold tracking-tight text-lg">Your inventory is empty</p>

                <p className="text-xs text-slate-400 mt-1.5 max-w-xs mx-auto">Add your first food item to start tracking expiry dates.</p>

              </div>

            ) : (

              filteredFoods.map((food) => (

                <FoodRow

                  key={food._id}

                  food={food}

                  onEdit={() => handleEditFood(food)}

                  onDelete={() => handleDeleteFood(food._id)}

                />

              ))

            )}

          </section>

        </main>

      </div>



      {/* Add and edit food dialog */}

      {showModal && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 p-4 backdrop-blur-sm animate-fade-in">

          <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-2xl relative max-h-[90vh] overflow-y-auto">

            <button

              onClick={() => { setShowModal(false); setEditingFood(null); }}

              className="absolute top-5 right-5 rounded-xl p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"

            >

              <X size={18} />

            </button>

            <h2 className="text-xl font-bold text-slate-900 tracking-tight mb-1">{editingFood ? "Edit food item" : "Add food item"}</h2>



            <form onSubmit={handleSaveFood} className="space-y-5">

              <FormField label="Food name">

                <input

                  type="text"

                  required

                  placeholder="e.g. Fresh spinach"

                  value={form.name}

                  onChange={(e) => setForm({ ...form, name: e.target.value })}

                  className={inputClass}

                />

              </FormField>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <FormField label="Category">

                  <select

                    value={form.category}

                    onChange={(e) => setForm({ ...form, category: e.target.value })}

                    className={inputClass}

                  >

                    {["Vegetables", "Fruits", "Dairy", "Bakery", "Meat", "Seafood", "Grains", "Beverages", "Frozen", "Other"].map((cat) => (

                      <option key={cat} value={cat} className="bg-white text-slate-800">{cat}</option>

                    ))}

                  </select>

                </FormField>

                <div className="grid grid-cols-2 gap-3">

                  <FormField label="Quantity">

                    <input

                      type="number"

                      min="1"

                      required

                      value={form.quantity}

                      onChange={(e) => setForm({ ...form, quantity: e.target.value })}

                      className={inputClass}

                    />

                  </FormField>

                  <FormField label="Unit">

                    <input

                      type="text"

                      placeholder="crates, kg, pcs"

                      value={form.unit}

                      onChange={(e) => setForm({ ...form, unit: e.target.value })}

                      className={inputClass}

                    />

                  </FormField>

                </div>

              </div>



              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">

                <FormField label="Purchase date">

                  <input

                    type="date"

                    required

                    value={form.purchaseDate}

                    onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })}

                    className={inputClass}

                  />

                </FormField>

                <FormField label="Expiry date">

                  <input

                    type="date"

                    required

                    value={form.expiryDate}

                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}

                    className={inputClass}

                  />

                </FormField>

              </div>



              <FormField label="Storage location">

                <select

                  value={form.storageLocation}

                  onChange={(e) => setForm({ ...form, storageLocation: e.target.value })}

                  className={inputClass}

                >

                  {["Refrigerator", "Freezer", "Pantry", "Countertop"].map((loc) => (

                    <option key={loc} value={loc} className="bg-white text-slate-800">{loc}</option>

                  ))}

                </select>

              </FormField>



              <FormField label="Notes (optional)">

                <textarea

                  placeholder="Add a note about this food..."

                  rows={2}

                  value={form.notes}

                  onChange={(e) => setForm({ ...form, notes: e.target.value })}

                  className={`${inputClass} resize-none`}

                />

              </FormField>



              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">

                <button

                  type="button"

                  onClick={() => { setShowModal(false); setEditingFood(null); }}

                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 hover:text-slate-900"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={saving}

                  className="flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-slate-900 transition-all duration-200 hover:bg-emerald-700 disabled:opacity-50"

                >

                  {saving && <LoaderCircle className="animate-spin" size={16} />}

                  {editingFood ? "Save changes" : "Save food item"}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>

  );

}



export default App;
