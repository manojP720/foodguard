import { useEffect, useMemo, useState } from "react";

import {

  LayoutDashboard, Package, Clock3, Trash2, Leaf, AlertTriangle, 

  CheckCircle2, X, LoaderCircle, RefreshCw, CalendarDays, MapPin, 

  Pencil, Search, Plus, Sparkles, ChevronRight, HelpCircle

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



const inputClass = "w-full rounded-2xl border border-white/10 bg-slate-900/60 px-4 py-3.5 text-sm text-white backdrop-blur-xl outline-none transition-all duration-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 placeholder:text-slate-500 shadow-inner";



function FormField({ label, children }) {

  return (

    <div className="space-y-2">

      <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase">{label}</span>

      {children}

    </div>

  );

}



function StatCard({ title, value, description, icon, type }) {

  const variants = {

    safe: { ring: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5", glow: "from-emerald-500/20 to-transparent" },

    warning: { ring: "border-amber-500/30 text-amber-400 bg-amber-500/5", glow: "from-amber-500/20 to-transparent" },

    danger: { ring: "border-rose-500/30 text-rose-400 bg-rose-500/5", glow: "from-rose-500/20 to-transparent" }

  };

  const style = variants[type] || variants.safe;



  return (

    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 sm:rounded-3xl sm:p-6 backdrop-blur-xl transition-all duration-500 hover:-translate-y-1.5 hover:border-white/20 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.7)] group">

      <div className={`absolute -right-20 -top-20 h-40 w-40 rounded-full bg-gradient-to-br ${style.glow} blur-3xl opacity-50 transition-opacity duration-500 group-hover:opacity-100`} />

      <div className="flex items-center justify-between mb-6">

        <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">{title}</p>

        <div className={`rounded-2xl border p-3 backdrop-blur-md ${style.ring}`}>{icon}</div>

      </div>

      <p className="text-4xl font-black tracking-tight text-white">{value}</p>

      <p className="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1.5">

        <span className="h-1 w-1 rounded-full bg-current opacity-70" />

        {description}

      </p>

    </div>

  );

}



function FoodRow({ food, onEdit, onDelete, onConsume }) {

  const { status, label } = getExpiryInfo(food.expiryDate);



  const badgeConfig = {

    danger: "bg-rose-500/10 text-rose-400 border-rose-500/20 ring-rose-500/30",

    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 ring-amber-500/30",

    imminent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 ring-cyan-500/30",

    safe: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 ring-emerald-500/30"

  };



  const emojiByCategory = { 

    Dairy: "🥛", Fruits: "🍎", Vegetables: "🥦", Bakery: "🍞", 

    Meat: "🥩", Seafood: "🐟", Grains: "🌾", Beverages: "🧃", Frozen: "🧊" 

  };



  return (

    <div className="group relative overflow-hidden flex flex-col gap-4 rounded-2xl border border-white/10 bg-slate-900/40 p-4 backdrop-blur-md transition-all duration-300 hover:border-white/15 hover:bg-slate-900/70 sm:flex-row sm:items-center sm:justify-between shadow-lg">

      <div className="flex min-w-0 items-center gap-4">

        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-2xl shadow-inner group-hover:scale-105 transition-transform duration-300">

          <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          {emojiByCategory[food.category] || "📦"}

        </div>

        <div className="min-w-0">

          <div className="flex items-center gap-2">

            <p className="truncate font-semibold text-white tracking-tight group-hover:text-emerald-400 transition-colors">{food.name}</p>

            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-white/5 border border-white/5 text-slate-400">{food.category}</span>

          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-medium text-slate-400">

            <span className="text-slate-300">{food.quantity} {food.unit}</span>

            <span className="text-slate-600">•</span>

            <span className="flex items-center gap-1"><MapPin size={12} className="text-slate-500" />{food.storageLocation || "Pantry"}</span>

            <span className="text-slate-600">•</span>

            <span className="flex items-center gap-1"><CalendarDays size={12} className="text-slate-500" />Exp: {new Date(food.expiryDate).toLocaleDateString()}</span>

          </div>

        </div>

      </div>

      <div className="flex items-center justify-between gap-3 border-t border-white/5 pt-3 sm:border-0 sm:pt-0 sm:justify-end">

        <span className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold ring-1 ${badgeConfig[status] || badgeConfig.safe}`}>

          <span className="relative flex h-1.5 w-1.5">

            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-70" />

            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />

          </span>

          {label}

        </span>

        <div className="flex items-center gap-2">

          <button type="button" onClick={onConsume} title="Mark as consumed" aria-label={`Mark ${food.name} as consumed`} className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 transition-all duration-200 hover:border-cyan-500/30 hover:bg-cyan-500/10 hover:text-cyan-300"><CheckCircle2 size={15} /></button>

          <button type="button" onClick={onEdit} title="Edit food item" aria-label={`Edit ${food.name}`} className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 transition-all duration-200 hover:border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400"><Pencil size={15} /></button>

          <button type="button" onClick={onDelete} title="Delete food item" aria-label={`Delete ${food.name}`} className="rounded-xl border border-white/5 bg-white/5 p-2.5 text-slate-400 transition-all duration-200 hover:border-rose-500/30 hover:bg-rose-500/10 hover:text-rose-400"><Trash2 size={15} /></button>

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

    <div className="relative min-h-screen bg-slate-950 text-slate-100 font-sans antialiased overflow-x-hidden">

      {/* Soft background accents */}

      <div className="absolute inset-0 z-0 pointer-events-none opacity-40">

        <div className="absolute top-[-10%] left-[-10%] h-[600px] w-[600px] rounded-full bg-emerald-500/10 blur-[140px]" />

        <div className="absolute bottom-[20%] right-[-5%] h-[500px] w-[500px] rounded-full bg-cyan-500/10 blur-[130px]" />

      </div>



      <div className="relative z-10 flex min-h-screen">

        {/* Primary navigation */}

        <aside className="hidden w-72 border-r border-white/5 bg-slate-900/20 p-6 backdrop-blur-2xl md:flex flex-col justify-between">

          <div>

            <div className="flex items-center gap-3 px-2 mb-10 group">

              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500 shadow-[0_0_25px_rgba(16,185,129,0.4)] transition-transform duration-500 group-hover:rotate-12">

                <Leaf className="text-slate-950 h-5 w-5 fill-slate-950" />

              </div>

              <div>

                <span className="text-lg font-black tracking-wider text-white uppercase block">FoodGuard</span>

                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block -mt-0.5">Food Inventory</span>

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

                  className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all duration-300 group ${

                    activeView === item.id

                      ? "bg-gradient-to-r from-emerald-500/10 to-transparent text-emerald-400 border-l-2 border-emerald-500 px-5"

                      : "text-slate-400 hover:bg-white/5 hover:text-slate-200"

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



          <div className="rounded-2xl border border-white/5 bg-white/5 p-4 backdrop-blur-md">

            <div className="flex items-center gap-3">

              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />

              <p className="text-xs font-semibold tracking-wide text-slate-400">Inventory connected</p>

            </div>

            <p className="text-[10px] text-slate-500 font-medium mt-1">Your food, tracked in one place</p>

          </div>

        </aside>



        {/* Primary Workspace */}

        <main className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-8 lg:p-10">
          <nav aria-label="Main navigation" className="mb-6 grid grid-cols-4 gap-2 md:hidden">
            {[
              { id: "Dashboard", icon: <LayoutDashboard size={16} /> },
              { id: "Inventory", icon: <Package size={16} /> },
              { id: "Expiring Soon", icon: <Clock3 size={16} /> },
              { id: "Food Waste", icon: <Trash2 size={16} /> },
            ].map((item) => (
              <button key={item.id} type="button" onClick={() => setActiveView(item.id)} className={`flex min-h-16 flex-col items-center justify-center gap-1.5 rounded-xl border px-1 py-2 text-[10px] font-semibold transition-colors ${activeView === item.id ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/5 bg-white/[0.03] text-slate-400 hover:bg-white/5"}`}>
                {item.icon}<span>{item.id}</span>
              </button>
            ))}
          </nav>

          <header className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between mb-10">

            <div>

              <div className="flex items-center gap-2 text-xs font-bold tracking-widest text-emerald-400 uppercase mb-1">

                <Sparkles size={12} /> SMART FOOD TRACKER

              </div>

              <h1 className="text-2xl font-black tracking-tight text-white sm:text-4xl">{activeView}</h1>

              <p className="text-sm font-medium text-slate-400 mt-1.5">Track your groceries, reduce waste, and use food before it expires.</p>

            </div>

            <button

              onClick={openAddModal}

              className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3.5 text-sm font-bold text-slate-950 transition-all duration-300 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)] active:scale-95"

            >

              <Plus size={16} strokeWidth={3} /> Add food item

            </button>

          </header>



          {/* Status messages */}

          {notice && (

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-sm text-emerald-400 backdrop-blur-md shadow-lg">

              <div className="flex items-center gap-3">

                <CheckCircle2 size={18} />

                <span className="font-medium tracking-wide">{notice}</span>

              </div>

              <button onClick={() => setNotice("")} className="text-slate-500 hover:text-emerald-400 p-1.5 rounded-xl hover:bg-white/5 transition-all">

                <X size={16} />

              </button>

            </div>

          )}



          {error && (

            <div className="mb-6 flex items-center justify-between rounded-2xl border border-rose-500/20 bg-rose-500/5 p-4 text-sm text-rose-400 backdrop-blur-md shadow-lg">

              <div className="flex items-center gap-3">

                <AlertTriangle size={18} />

                <span className="font-medium tracking-wide">{error}</span>

              </div>

              <button onClick={() => setError("")} className="text-slate-500 hover:text-rose-400 p-1.5 rounded-xl hover:bg-white/5 transition-all">

                <X size={16} />

              </button>

            </div>

          )}



          {/* Inventory overview */}

          <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

            <StatCard title="Items in inventory" value={stats.total} description="Food items you are tracking" icon={<Package size={18} />} type="safe" />

            <StatCard title="Expiring soon" value={stats.expiring} description="Expiry within the next 7 days" icon={<Clock3 size={18} />} type="warning" />

            <StatCard title="Already expired" value={stats.expired} description="Items past their expiry date" icon={<Trash2 size={18} />} type="danger" />

            <StatCard title="Food used" value={stats.consumed} description="Items marked as consumed" icon={<CheckCircle2 size={18} />} type="safe" />

          </section>



          {/* Search and refresh */}

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">

            <div className="relative flex-1 group">

              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500 transition-colors group-focus-within:text-emerald-400" />

              <input

                type="text"

                placeholder="Search food by name or category..."

                value={search}

                onChange={(e) => setSearch(e.target.value)}

                className="w-full rounded-2xl border border-white/5 bg-slate-900/30 pl-12 pr-4 py-3.5 text-sm text-white placeholder:text-slate-500 outline-none transition-all duration-300 focus:border-white/10 focus:bg-slate-900/60 focus:ring-4 focus:ring-emerald-500/5 shadow-inner"

              />

            </div>

            <button

              onClick={loadFoods}

              disabled={loading}

              className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-slate-900/30 text-slate-400 transition-all duration-300 hover:border-white/10 hover:bg-slate-900/60 hover:text-white disabled:opacity-40"

            >

              <RefreshCw size={16} className={loading ? "animate-spin text-emerald-400" : ""} />

            </button>

          </div>



          {/* Food inventory list */}

          <section className="space-y-3">

            {loading ? (

              <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-4">

                <LoaderCircle className="animate-spin text-emerald-400" size={36} />

                <p className="text-sm font-semibold tracking-wider uppercase text-slate-400 animate-pulse">Loading your food inventory...</p>

              </div>

            ) : filteredFoods.length === 0 ? (

              <div className="text-center py-20 rounded-3xl border border-dashed border-white/5 bg-slate-900/10 backdrop-blur-sm">

                <Package className="mx-auto text-slate-700 mb-4" size={48} />

                <p className="text-slate-400 font-bold tracking-tight text-lg">Your inventory is empty</p>

                <p className="text-xs text-slate-600 mt-1.5 max-w-xs mx-auto">Add your first food item to start tracking expiry dates.</p>

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

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-md animate-fade-in">

          <div className="w-full max-w-xl rounded-3xl border border-white/10 bg-slate-900/80 p-7 shadow-2xl relative backdrop-blur-2xl max-h-[90vh] overflow-y-auto">

            <button

              onClick={() => { setShowModal(false); setEditingFood(null); }}

              className="absolute top-5 right-5 rounded-xl p-2 text-slate-400 transition-all hover:bg-white/5 hover:text-white"

            >

              <X size={18} />

            </button>

            <h2 className="text-xl font-black text-white tracking-tight mb-6">{editingFood ? "Edit food item" : "Add food item"}</h2>



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

                      <option key={cat} value={cat} className="bg-slate-950 text-white">{cat}</option>

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

                    <option key={loc} value={loc} className="bg-slate-950 text-white">{loc}</option>

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



              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/5">

                <button

                  type="button"

                  onClick={() => { setShowModal(false); setEditingFood(null); }}

                  className="rounded-2xl border border-white/5 px-5 py-3.5 text-sm font-bold text-slate-400 transition-all hover:bg-white/5 hover:text-white"

                >

                  Cancel

                </button>

                <button

                  type="submit"

                  disabled={saving}

                  className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 transition-all duration-300 hover:shadow-[0_0_25px_rgba(16,185,129,0.2)] disabled:opacity-50"

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
