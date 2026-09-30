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
} from "lucide-react";

function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 hidden h-screen w-64 border-r border-white/10 bg-slate-900/80 p-5 lg:block">
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
          <NavItem icon={<LayoutDashboard size={19} />} text="Dashboard" active />
          <NavItem icon={<Package size={19} />} text="Inventory" />
          <NavItem icon={<Clock3 size={19} />} text="Expiring Soon" />
          <NavItem icon={<Trash2 size={19} />} text="Food Waste" />
          <NavItem icon={<BarChart3 size={19} />} text="Analytics" />
        </nav>

        <div className="absolute bottom-6 left-5 right-5">
          <NavItem icon={<Settings size={19} />} text="Settings" />
        </div>
      </aside>

      {/* Main */}
      <main className="lg:ml-64">
        {/* Header */}
        <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/80 px-6 py-5 backdrop-blur-xl">
          <div>
            <p className="text-sm text-slate-400">Food Inventory</p>
            <h2 className="text-2xl font-bold">Dashboard</h2>
          </div>

          <div className="flex items-center gap-3">
            <button className="rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
              <Search size={19} />
            </button>

            <button className="relative rounded-xl border border-white/10 bg-white/5 p-2.5 hover:bg-white/10">
              <Bell size={19} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-400" />
            </button>

            <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-emerald-500 font-bold text-slate-950 sm:flex">
              M
            </div>
          </div>
        </header>

        <div className="p-6">
          {/* Welcome */}
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-center">
            <div>
              <p className="mb-1 text-slate-400">Good evening 👋</p>
              <h3 className="text-3xl font-bold">Welcome back, Manoj</h3>
              <p className="mt-2 text-slate-400">
                Keep your food fresh and reduce unnecessary waste.
              </p>
            </div>

            <button className="flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400">
              <Plus size={20} />
              Add Food
            </button>
          </div>

          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Total Items"
              value="24"
              description="In your inventory"
              icon={<Package size={22} />}
            />

            <StatCard
              title="Expiring Soon"
              value="4"
              description="Within 7 days"
              icon={<Clock3 size={22} />}
              warning
            />

            <StatCard
              title="Expired"
              value="2"
              description="Needs attention"
              icon={<AlertTriangle size={22} />}
              danger
            />

            <StatCard
              title="Waste Saved"
              value="18%"
              description="Compared to last month"
              icon={<CheckCircle2 size={22} />}
              success
            />
          </div>

          {/* Recent Inventory */}
          <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Recent Inventory</h3>
                <p className="text-sm text-slate-400">
                  Your recently added food items
                </p>
              </div>

              <button className="text-sm font-medium text-emerald-400 hover:text-emerald-300">
                View all
              </button>
            </div>

            <div className="space-y-3">
              <FoodRow
                emoji="🥛"
                name="Milk"
                category="Dairy"
                quantity="2 packets"
                expiry="Expires in 2 days"
                status="warning"
              />

              <FoodRow
                emoji="🍎"
                name="Apples"
                category="Fruits"
                quantity="6 pieces"
                expiry="Expires in 8 days"
                status="safe"
              />

              <FoodRow
                emoji="🍞"
                name="Bread"
                category="Bakery"
                quantity="1 packet"
                expiry="Expired yesterday"
                status="danger"
              />
            </div>
          </section>

          {/* Quick Insight */}
          <section className="mt-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
            <div className="flex gap-4">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <Leaf className="text-emerald-400" size={24} />
              </div>

              <div>
                <h3 className="font-semibold">FoodGuard Insight</h3>
                <p className="mt-1 text-sm leading-6 text-slate-400">
                  You have 4 items approaching their expiry date. Consider
                  using them first to reduce food waste.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, text, active = false }) {
  return (
    <button
      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
        active
          ? "bg-emerald-500/10 text-emerald-400"
          : "text-slate-400 hover:bg-white/5 hover:text-white"
      }`}
    >
      {icon}
      {text}
    </button>
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

function FoodRow({ emoji, name, category, quantity, expiry, status }) {
  const statusStyle =
    status === "danger"
      ? "bg-red-500/10 text-red-400"
      : status === "warning"
        ? "bg-amber-500/10 text-amber-400"
        : "bg-emerald-500/10 text-emerald-400";

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-slate-900/60 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-xl">
          {emoji}
        </div>

        <div>
          <p className="font-medium">{name}</p>
          <p className="text-xs text-slate-500">
            {category} • {quantity}
          </p>
        </div>
      </div>

      <span className={`w-fit rounded-full px-3 py-1 text-xs ${statusStyle}`}>
        {expiry}
      </span>
    </div>
  );
}

export default App;