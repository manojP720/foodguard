
import { useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Leaf,
  LockKeyhole,
  Mail,
  ScanLine,
  ShieldCheck,
  Sparkles,
  UserRound,
  AlertCircle,
  LoaderCircle,
} from "lucide-react";
import { login, signup } from "./services/authService";

const fieldClass =
  "w-full rounded-xl border border-emerald-950/80 bg-[#081b15] py-3.5 pl-11 pr-12 text-sm text-slate-100 placeholder:text-slate-500 outline-none transition duration-200 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-400/10";

function FieldIcon({ children }) {
  return (
    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-emerald-300/70">
      {children}
    </span>
  );
}

function AuthInput({
  label,
  icon,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  required = true,
  minLength,
  maxLength,
  suffix,
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-emerald-50/90">
        {label}
      </label>
      <div className="relative">
        <FieldIcon>{icon}</FieldIcon>
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          className={fieldClass}
        />
        {suffix}
      </div>
    </div>
  );
}

export default function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  function changeMode(nextMode) {
    setMode(nextMode);
    setError("");
    setPassword("");
    setShowPassword(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();

    if (isSignup && !cleanName) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password.length > 72) {
      setError("Password must be 72 characters or fewer.");
      return;
    }

    setLoading(true);

    try {
      const result = isSignup
        ? await signup(cleanName, cleanEmail, password)
        : await login(cleanEmail, password);

      if (!result?.token || !result?.user) {
        throw new Error("Unexpected server response. Please try again.");
      }

      onLogin(result);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="fg-auth-shell relative isolate flex min-h-screen items-center justify-center overflow-hidden px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <style>{`
        .fg-auth-shell {
          background:
            radial-gradient(ellipse at 8% 10%, rgba(16,185,129,.14), transparent 34%),
            radial-gradient(ellipse at 88% 88%, rgba(13,148,136,.12), transparent 32%),
            linear-gradient(135deg,#04110d 0%,#061712 48%,#081b15 100%);
        }
        .fg-auth-orb {
          position:absolute;
          border-radius:9999px;
          pointer-events:none;
          filter:blur(70px);
          opacity:.22;
        }
        .fg-auth-panel {
          background:linear-gradient(145deg,rgba(10,36,26,.94),rgba(5,22,16,.88));
          border:1px solid rgba(52,211,153,.17);
          box-shadow:0 28px 90px rgba(0,0,0,.30),inset 0 1px 0 rgba(255,255,255,.035);
          backdrop-filter:blur(22px);
        }
        .fg-auth-logo {
          background:linear-gradient(145deg,#6ee7b7,#10b981 54%,#0f766e);
          box-shadow:0 0 0 1px rgba(167,243,208,.28),0 0 32px rgba(16,185,129,.30),inset 0 1px 0 rgba(255,255,255,.32);
        }
        .fg-auth-button {
          background:linear-gradient(105deg,#059669 0%,#10b981 48%,#0d9488 100%);
          border:1px solid rgba(167,243,208,.24);
          box-shadow:0 10px 26px rgba(16,185,129,.17),inset 0 1px 0 rgba(255,255,255,.18);
          transition:transform .2s ease,box-shadow .2s ease,filter .2s ease;
        }
        .fg-auth-button:hover:not(:disabled) {
          transform:translateY(-1px);
          box-shadow:0 13px 32px rgba(16,185,129,.25),0 0 24px rgba(16,185,129,.13);
          filter:saturate(1.08);
        }
        .fg-auth-feature {
          background:linear-gradient(145deg,rgba(16,185,129,.10),rgba(15,118,110,.035));
          border:1px solid rgba(52,211,153,.13);
        }
        .fg-auth-tab {
          transition:background .2s ease,color .2s ease,box-shadow .2s ease;
        }
        .fg-auth-tab-active {
          background:linear-gradient(105deg,rgba(16,185,129,.20),rgba(13,148,136,.12));
          color:#d1fae5;
          box-shadow:inset 0 0 0 1px rgba(52,211,153,.23),0 0 20px rgba(16,185,129,.07);
        }
        @keyframes fgAuthFloat {
          0%,100% { transform:translateY(0) }
          50% { transform:translateY(-6px) }
        }
        .fg-auth-float { animation:fgAuthFloat 6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .fg-auth-float { animation:none }
          .fg-auth-button,.fg-auth-tab { transition:none }
        }
      `}</style>

      <div
        aria-hidden="true"
        className="fg-auth-orb -left-24 -top-20 h-72 w-72 bg-emerald-400"
      />
      <div
        aria-hidden="true"
        className="fg-auth-orb -bottom-24 -right-16 h-80 w-80 bg-teal-400"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.35)_1px,transparent_1px)] [background-size:52px_52px]"
      />

      <div className="relative z-10 mx-auto grid w-full max-w-6xl items-center gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
        <section className="hidden lg:block">
          <div className="mb-8 flex items-center gap-4">
            <div className="fg-auth-logo flex h-14 w-14 items-center justify-center rounded-2xl text-white">
              <Leaf size={29} strokeWidth={1.8} />
            </div>
            <div>
              <p className="text-2xl font-bold tracking-tight text-white">
                FoodGuard
              </p>
              <p className="mt-1 text-sm text-emerald-100/55">
                Waste less. Save more.
              </p>
            </div>
          </div>

          <div className="mb-8">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-3 py-1.5 text-xs font-medium text-emerald-200">
              <Sparkles size={14} />
              SMART FOOD MANAGEMENT
            </div>

            <h1 className="max-w-xl text-5xl font-semibold leading-[1.15] tracking-tight text-white xl:text-6xl">
              Fresh food.
              <span className="mt-2 block bg-gradient-to-r from-emerald-300 via-green-200 to-teal-300 bg-clip-text text-transparent">
                Less waste.
              </span>
              Better living.
            </h1>

            <p className="mt-5 max-w-lg text-base leading-7 text-emerald-50/60">
              Keep your kitchen organized, track expiry dates, and make every
              grocery item count — all in one place.
            </p>
          </div>

          <div className="grid max-w-lg gap-3 sm:grid-cols-2">
            <div className="fg-auth-feature rounded-2xl p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300">
                <ScanLine size={21} />
              </div>
              <p className="font-semibold text-white">Smart inventory</p>
              <p className="mt-1 text-xs leading-5 text-emerald-50/55">
                Keep your food items organized.
              </p>
            </div>

            <div className="fg-auth-feature rounded-2xl p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400/10 text-teal-300">
                <ShieldCheck size={21} />
              </div>
              <p className="font-semibold text-white">Private account</p>
              <p className="mt-1 text-xs leading-5 text-emerald-50/55">
                Your inventory stays linked to your account.
              </p>
            </div>
          </div>

          <div className="mt-7 flex items-center gap-3 text-sm text-emerald-100/45">
            <CheckCircle2 size={17} className="text-emerald-400" />
            Simple tracking for a smarter kitchen
          </div>
        </section>

        <section className="fg-auth-panel relative mx-auto w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8">
          <div className="absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/70 to-transparent" />

          <div className="mb-7 text-center lg:hidden">
            <div className="fg-auth-logo fg-auth-float mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl text-white">
              <Leaf size={29} strokeWidth={1.8} />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">
              FoodGuard
            </h1>
            <p className="mt-2 text-sm text-emerald-100/55">
              Waste less. Save more.
            </p>
          </div>

          <div className="mb-7 hidden text-center lg:block">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.08] text-emerald-300">
              <LockKeyhole size={22} />
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm text-emerald-50/50">
              {isSignup
                ? "Start your smarter food journey."
                : "Sign in to continue to your kitchen."}
            </p>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-emerald-900/70 bg-[#04120d]/80 p-1">
            <button
              type="button"
              onClick={() => changeMode("login")}
              className={`fg-auth-tab rounded-lg px-3 py-2.5 text-sm font-semibold ${
                mode === "login"
                  ? "fg-auth-tab-active"
                  : "text-emerald-100/45 hover:text-emerald-100/80"
              }`}
            >
              Login
            </button>
            <button
              type="button"
              onClick={() => changeMode("signup")}
              className={`fg-auth-tab rounded-lg px-3 py-2.5 text-sm font-semibold ${
                mode === "signup"
                  ? "fg-auth-tab-active"
                  : "text-emerald-100/45 hover:text-emerald-100/80"
              }`}
            >
              Create account
            </button>
          </div>

          <div className="mb-6 lg:hidden">
            <h2 className="text-xl font-semibold text-white">
              {isSignup ? "Create your account" : "Welcome back"}
            </h2>
            <p className="mt-1 text-sm text-emerald-50/50">
              {isSignup
                ? "Enter your details to get started."
                : "Log in to access your food inventory."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignup && (
              <AuthInput
                label="Full name"
                icon={<UserRound size={18} />}
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Enter your full name"
                autoComplete="name"
                maxLength={60}
              />
            )}

            <AuthInput
              label="Email address"
              icon={<Mail size={18} />}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              maxLength={254}
            />

            <AuthInput
              label="Password"
              icon={<LockKeyhole size={18} />}
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={8}
              maxLength={72}
              suffix={
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-emerald-100/45 transition hover:text-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400/40"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              }
            />

            {!isSignup && (
              <div className="flex justify-end">
                <span
                  title="Password reset must be configured on the server first."
                  className="cursor-help text-xs text-emerald-300/60"
                >
                  Forgot password?
                </span>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-xl border border-red-400/20 bg-red-400/[0.08] p-3.5 text-sm leading-5 text-red-200"
              >
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="fg-auth-button group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={18} className="animate-spin" />
                  Please wait...
                </>
              ) : (
                <>
                  {isSignup ? "Create account" : "Login to FoodGuard"}
                  <ArrowRight
                    size={18}
                    className="transition-transform group-hover:translate-x-1"
                  />
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-emerald-900/60" />
            <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-emerald-100/30">
              Your kitchen, organized
            </span>
            <div className="h-px flex-1 bg-emerald-900/60" />
          </div>

          <div className="flex items-start justify-center gap-2 text-center text-xs leading-5 text-emerald-100/40">
            <ShieldCheck size={15} className="mt-0.5 shrink-0 text-emerald-400/70" />
            <p>
              Your account keeps your food inventory separate from other users.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
