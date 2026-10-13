import { useState, type FormEvent, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Mail,
  UserRound,
  LockKeyhole,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Check,
  AlertCircle,
  Truck,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config/api";

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Live password strength calculation
  const passwordCriteria = useMemo(() => {
    return {
      hasLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasNumber: /[0-9]/.test(password),
    };
  }, [password]);

  const strengthScore = useMemo(() => {
    let score = 0;
    if (passwordCriteria.hasLength) score++;
    if (passwordCriteria.hasUpper) score++;
    if (passwordCriteria.hasNumber) score++;
    return score;
  }, [passwordCriteria]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      newErrors.name = "Please enter your full name (minimum 2 letters)";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
      newErrors.password = "Include at least one uppercase letter and one number";
    }

    if (confirmPassword !== password) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    if (!accepted) {
      newErrors.terms = "Please accept the terms to create your account";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");

    if (!validate()) return;

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data: {
        message: string;
        token?: string;
        user?: { id: number; name: string; email: string };
      } = await response.json();

      if (!response.ok) {
        setApiError(data.message || "Registration failed. This email may already be in use.");
        return;
      }

      if (!data.token || !data.user) {
        setApiError("Invalid response from server. Please try again.");
        return;
      }

      setSession(data.user, data.token);
      showToast(`Welcome to NOVA, ${data.user.name}! 🎉`, "success");
      navigate("/account");
    } catch (error) {
      console.warn("Backend register connection error:", error);
      setApiError(
        "Unable to connect to registration server. If running locally without MySQL, click below to test with a guest session."
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Registration
  const handleQuickDemo = () => {
    const demoUser = {
      id: 888,
      name: name.trim() || "Jordan Lee",
      email: email.trim() || "jordan.shopper@novastore.com",
    };
    const demoToken = "demo-jwt-token-registered";
    setSession(demoUser, demoToken);
    showToast("Account activated in Demo Mode! 🚀", "success");
    navigate("/account");
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-300/30 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-rose-300/20 rounded-full blur-3xl pointer-events-none -z-0" />

      {/* Main Container Card */}
      <div className="w-full max-w-5xl bg-white rounded-3xl sm:rounded-[32px] shadow-2xl border border-gray-100/80 overflow-hidden relative z-10 grid grid-cols-1 lg:grid-cols-12">
        
        {/* Left Editorial Panel (5 cols) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-neutral-950 via-gray-900 to-neutral-900 text-white p-10 xl:p-12 flex-col justify-between relative overflow-hidden">
          {/* Subtle geometric radiant flare */}
          <div className="absolute top-0 right-0 w-72 h-72 bg-orange-500/15 rounded-full blur-2xl pointer-events-none" />

          {/* Logo & Header */}
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-1.5 text-2xl font-black tracking-tight group">
              <span className="text-white group-hover:text-orange-400 transition-colors">NOVA</span>
              <span className="text-orange-500 text-3xl font-black">.</span>
            </Link>

            <div className="mt-10">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-300 border border-white/10 mb-5">
                <Sparkles size={13} className="text-orange-400" />
                Join the Club
              </div>

              <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight">
                Create Your Account & Unlock VIP Shopping.
              </h1>

              <p className="mt-4 text-gray-300 text-sm leading-relaxed font-normal">
                Join over 10,000 discerning shoppers with instant order tracking, private flash drops, and curated edits.
              </p>
            </div>
          </div>

          {/* Member Benefits List */}
          <div className="relative z-10 my-6 space-y-3.5 bg-white/5 border border-white/10 p-5 rounded-2xl backdrop-blur-md">
            <div className="flex items-center gap-3 text-xs text-gray-200">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                <Truck size={14} />
              </div>
              <span className="font-medium">Free express shipping on orders over $100</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-200">
              <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <Heart size={14} />
              </div>
              <span className="font-medium">Save and synchronize wishlist items across devices</span>
            </div>

            <div className="flex items-center gap-3 text-xs text-gray-200">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <ShieldCheck size={14} />
              </div>
              <span className="font-medium">30-day hassle-free returns & warranty protection</span>
            </div>
          </div>

          {/* Bottom Security / Trust Badges */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-400" />
              <span>100% Privacy Protected</span>
            </div>
            <span>© 2026 NOVA</span>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-between">
          
          {/* Top Bar with Home Link */}
          <div className="flex items-center justify-between mb-6">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-orange-600 transition group"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Store</span>
            </Link>

            <div className="lg:hidden">
              <Link to="/" className="text-xl font-black">
                NOVA<span className="text-orange-500">.</span>
              </Link>
            </div>
          </div>

          {/* Form Content */}
          <div className="max-w-md w-full mx-auto">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Get Started with NOVA
              </h2>
              <p className="mt-1.5 text-sm text-gray-500 font-normal">
                Already registered?{" "}
                <Link
                  to="/login"
                  className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
                >
                  Sign in here
                </Link>
              </p>
            </div>

            {/* Social Registration */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              <button
                type="button"
                onClick={() => {
                  setName("Google User");
                  setEmail("google.signup@example.com");
                  setPassword("StrongPass123!");
                  setConfirmPassword("StrongPass123!");
                  setAccepted(true);
                  showToast("Google OAuth simulated! Form auto-filled.", "info");
                }}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-xs sm:text-sm font-bold text-gray-700 transition active:scale-95 shadow-xs"
              >
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setName("Apple User");
                  setEmail("apple.signup@example.com");
                  setPassword("StrongPass123!");
                  setConfirmPassword("StrongPass123!");
                  setAccepted(true);
                  showToast("Apple ID simulated! Form auto-filled.", "info");
                }}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-xs sm:text-sm font-bold text-gray-700 transition active:scale-95 shadow-xs"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.04-.51 2.67-1.26z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-5">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 absolute">
                or sign up with email
              </span>
            </div>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-3.5">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserRound
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
                    }}
                    placeholder="e.g. Maya Lin"
                    className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all ${
                      errors.name
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Email Address */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: "" }));
                    }}
                    placeholder="name@example.com"
                    className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-sm font-medium outline-none transition-all ${
                      errors.email
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: "" }));
                    }}
                    placeholder="Minimum 8 characters"
                    className={`w-full rounded-2xl border py-3 pl-11 pr-12 text-sm font-medium outline-none transition-all ${
                      errors.password
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Password Strength Indicator Bars */}
                {password && (
                  <div className="mt-2 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex gap-1.5 h-1.5">
                      <div
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                          strengthScore >= 1
                            ? strengthScore === 1
                              ? "bg-rose-500"
                              : strengthScore === 2
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                          strengthScore >= 2
                            ? strengthScore === 2
                              ? "bg-amber-500"
                              : "bg-emerald-500"
                            : "bg-gray-200"
                        }`}
                      />
                      <div
                        className={`flex-1 rounded-full transition-colors duration-300 ${
                          strengthScore >= 3 ? "bg-emerald-500" : "bg-gray-200"
                        }`}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-gray-500 pt-0.5">
                      <span
                        className={`flex items-center gap-1 ${
                          passwordCriteria.hasLength ? "text-emerald-600 font-semibold" : ""
                        }`}
                      >
                        {passwordCriteria.hasLength ? <Check size={11} /> : <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />}
                        8+ chars
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          passwordCriteria.hasUpper ? "text-emerald-600 font-semibold" : ""
                        }`}
                      >
                        {passwordCriteria.hasUpper ? <Check size={11} /> : <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />}
                        1 uppercase
                      </span>
                      <span
                        className={`flex items-center gap-1 ${
                          passwordCriteria.hasNumber ? "text-emerald-600 font-semibold" : ""
                        }`}
                      >
                        {passwordCriteria.hasNumber ? <Check size={11} /> : <span className="w-2.5 h-2.5 rounded-full bg-gray-300 inline-block" />}
                        1 number
                      </span>
                    </div>
                  </div>
                )}

                {errors.password && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <LockKeyhole
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <input
                    type={showConfirm ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword)
                        setErrors((prev) => ({ ...prev, confirmPassword: "" }));
                    }}
                    placeholder="Repeat your password"
                    className={`w-full rounded-2xl border py-3 pl-11 pr-12 text-sm font-medium outline-none transition-all ${
                      errors.confirmPassword
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                  >
                    {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms Checkbox */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 text-xs text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={(e) => {
                      setAccepted(e.target.checked);
                      if (errors.terms) setErrors((prev) => ({ ...prev, terms: "" }));
                    }}
                    className="w-4 h-4 mt-0.5 rounded text-orange-600 focus:ring-orange-500 border-gray-300 accent-orange-600 shrink-0"
                  />
                  <span>
                    I accept NOVA’s{" "}
                    <span className="font-semibold text-gray-900 underline">Terms of Service</span>{" "}
                    and{" "}
                    <span className="font-semibold text-gray-900 underline">Privacy Policy</span>.
                  </span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.terms}
                  </p>
                )}
              </div>

              {/* API Error Box */}
              {apiError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/70 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{apiError}</div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-950 hover:bg-orange-600 active:scale-[0.98] text-white py-3.5 px-6 rounded-2xl font-bold text-sm shadow-xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Creating Your Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Quick Demo Access Bar */}
              <div className="pt-1 text-center">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-800 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} className="text-orange-600" />
                  <span>One-Click Guest Demo Registration</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-6 pt-3 border-t border-gray-100 text-center text-xs text-gray-400">
            Protected by reCAPTCHA and subject to the NOVA Security Standards.
          </div>
        </div>

      </div>
    </div>
  );
}