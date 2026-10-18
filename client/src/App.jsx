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