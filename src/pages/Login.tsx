import { useState, useEffect, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Lock,
  Mail,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Star,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  X,
  KeyRound,
  RefreshCw,
  Check,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { API_BASE_URL } from "../config/api";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  // Multi-step Account Recovery State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"email" | "code_password" | "success">("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [resetCode, setResetCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [recoveryLoading, setRecoveryLoading] = useState(false);
  const [recoveryError, setRecoveryError] = useState("");
  const [generatedCodeDemo, setGeneratedCodeDemo] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  // Recovery timer countdown
  useEffect(() => {
    let interval: any;
    if (resendTimer > 0) {
      interval = setInterval(() => setResendTimer((t) => t - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email address is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
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

      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
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
        setApiError(data.message || "Invalid credentials. Please verify your email and password.");
        return;
      }

      if (!data.token || !data.user) {
        setApiError("Invalid response from server. Please try again.");
        return;
      }

      setSession(data.user, data.token);
      showToast(`Welcome back, ${data.user.name}! 👋`, "success");
      navigate("/account");
    } catch (error) {
      console.warn("Backend login connection error:", error);
      setApiError(
        "Unable to connect to the authentication server. If running locally without MySQL, you can use the Demo Account button below."
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick 1-click Demo Account login
  const handleQuickDemo = () => {
    const demoUser = {
      id: 999,
      name: "Alex Morgan",
      email: "alex.demo@novastore.com",
    };
    const demoToken = "demo-jwt-token-active";
    setSession(demoUser, demoToken);
    showToast("Signed in as Demo Shopper! ✨", "success");
    navigate("/account");
  };

  // Password strength checklist for new password in recovery
  const recMinLength = newPassword.length >= 8;
  const recUpper = /[A-Z]/.test(newPassword);
  const recLower = /[a-z]/.test(newPassword);
  const recNumber = /[0-9]/.test(newPassword);
  const recSpecial = /[^A-Za-z0-9]/.test(newPassword);
  const isRecPasswordValid = recMinLength && recUpper && recLower && recNumber && recSpecial;

  // Step 1: Request 6-digit recovery code
  const handleRequestCode = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError("");

    const normEmail = forgotEmail.trim().toLowerCase();
    if (!normEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normEmail)) {
      setRecoveryError("Please enter a valid registered email address.");
      return;
    }

    try {
      setRecoveryLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normEmail }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to process recovery request.");
      }

      setGeneratedCodeDemo(data.resetCode || null);
      if (data.resetCode) {
        setResetCode(data.resetCode);
      }
      setRecoveryStep("code_password");
      setResendTimer(45);
      showToast("Verification code generated! ✉️", "success");
    } catch (err: any) {
      setRecoveryError(err.message || "Unable to reach server. Please check your network.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Resend code handler
  const handleResendCode = async () => {
    if (resendTimer > 0 || recoveryLoading) return;
    setRecoveryError("");
    try {
      setRecoveryLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to resend code.");
      setGeneratedCodeDemo(data.resetCode || null);
      if (data.resetCode) setResetCode(data.resetCode);
      setResendTimer(45);
      showToast("Fresh verification code sent! ✉️", "info");
    } catch (err: any) {
      setRecoveryError(err.message || "Could not resend code. Please try again.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Step 2: Reset Password with code
  const handleResetPassword = async (e: FormEvent) => {
    e.preventDefault();
    setRecoveryError("");

    const cleanCode = resetCode.trim();
    if (cleanCode.length !== 6) {
      setRecoveryError("Please enter the complete 6-digit verification code.");
      return;
    }

    if (!isRecPasswordValid) {
      setRecoveryError("Please ensure your new password satisfies all strength requirements.");
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setRecoveryError("Passwords do not match. Please re-enter.");
      return;
    }

    try {
      setRecoveryLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          resetCode: cleanCode,
          newPassword,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password.");
      }

      setRecoveryStep("success");
      showToast("Password updated successfully! 🎉", "success");
    } catch (err: any) {
      setRecoveryError(err.message || "An error occurred while resetting password.");
    } finally {
      setRecoveryLoading(false);
    }
  };

  // Finish recovery and return to sign in
  const handleFinishRecovery = () => {
    setShowForgotModal(false);
    setEmail(forgotEmail);
    setPassword("");
    setRecoveryStep("email");
    setResetCode("");
    setNewPassword("");
    setConfirmNewPassword("");
    setGeneratedCodeDemo(null);
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

            <div className="mt-12">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-orange-300 border border-white/10 mb-5">
                <Sparkles size={13} className="text-orange-400" />
                Member Privileges
              </div>

              <h1 className="text-3xl xl:text-4xl font-black leading-tight tracking-tight">
                Welcome Back to Premium Shopping.
              </h1>

              <p className="mt-4 text-gray-300 text-sm leading-relaxed font-normal">
                Access curated apparel, high-performance tech essentials, and your customized live order tracking.
              </p>
            </div>
          </div>

          {/* Floating Customer Review Testimonial Card */}
          <div className="relative z-10 my-8 bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl shadow-xl animate-float-slow">
            <div className="flex items-center gap-1 text-amber-400 mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-xs text-gray-200 italic leading-relaxed">
              "The smoothest checkout experience and fastest order deliveries I've ever experienced."
            </p>
            <div className="mt-3 flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-white/10">
              <span className="font-semibold text-white">Sophie V. — Verified Buyer</span>
              <span className="text-emerald-400 font-medium">Delivered in 2 Days</span>
            </div>
          </div>

          {/* Bottom Security / Trust Badges */}
          <div className="relative z-10 pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-orange-400" />
              <span>256-Bit SSL Encrypted</span>
            </div>
            <span>© 2026 NOVA</span>
          </div>
        </div>

        {/* Right Form Panel (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-10 xl:p-12 flex flex-col justify-between">
          
          {/* Top Bar with Home Link */}
          <div className="flex items-center justify-between mb-8">
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
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                Sign In to Your Account
              </h2>
              <p className="mt-2 text-sm text-gray-500 font-normal">
                Don't have an account yet?{" "}
                <Link
                  to="/register"
                  className="font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
                >
                  Create an account
                </Link>
              </p>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <button
                type="button"
                onClick={() => {
                  setEmail("google.user@example.com");
                  setPassword("Password123!");
                  showToast("Google OAuth simulated! Click Sign In.", "info");
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
                  setEmail("apple.user@example.com");
                  setPassword("Password123!");
                  showToast("Apple ID simulated! Click Sign In.", "info");
                }}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-2xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50/80 text-xs sm:text-sm font-bold text-gray-700 transition active:scale-95 shadow-xs"
              >
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.62-.75 1.04-1.8 0.93-2.85-.9.04-2 0.6-2.65 1.35-.58.66-1.09 1.73-.95 2.76.99.08 2.04-.51 2.67-1.26z" />
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-6">
              <div className="border-t border-gray-200 w-full" />
              <span className="bg-white px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 absolute">
                or email
              </span>
            </div>

            {/* Main Form */}
            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
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
                    className={`w-full rounded-2xl border py-3.5 pl-11 pr-4 text-sm font-medium outline-none transition-all ${
                      errors.email
                        ? "border-rose-400 bg-rose-50/20 focus:border-rose-500 focus:ring-4 focus:ring-rose-100"
                        : "border-gray-200 bg-gray-50/50 hover:bg-white focus:bg-white focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.email}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline transition"
                  >
                    Forgot password?
                  </button>
                </div>
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
                    placeholder="Enter your password"
                    className={`w-full rounded-2xl border py-3.5 pl-11 pr-12 text-sm font-medium outline-none transition-all ${
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
                {errors.password && (
                  <p className="mt-1.5 text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={13} />
                    {errors.password}
                  </p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 text-xs sm:text-sm font-medium text-gray-600 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 accent-orange-600"
                  />
                  <span>Keep me signed in</span>
                </label>

                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep("email");
                    setRecoveryError("");
                    setResetCode("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                    if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                      setForgotEmail(email);
                    }
                    setShowForgotModal(true);
                  }}
                  className="text-xs sm:text-sm font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer"
                >
                  Forgot password?
                </button>
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
                className="w-full bg-gray-950 hover:bg-orange-600 active:scale-[0.98] text-white py-4 px-6 rounded-2xl font-bold text-sm shadow-xl hover:shadow-orange-500/25 transition-all duration-300 flex items-center justify-center gap-2.5 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to Account</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>

              {/* Quick Demo Access Bar */}
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={handleQuickDemo}
                  className="w-full bg-orange-50 hover:bg-orange-100 border border-orange-200/80 text-orange-800 text-xs font-bold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <Sparkles size={14} className="text-orange-600" />
                  <span>One-Click Guest Demo Login (Skip Form)</span>
                </button>
              </div>
            </form>
          </div>

          {/* Footer note */}
          <div className="mt-8 pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
            By signing in, you agree to NOVA’s Terms of Service and Privacy Policy.
          </div>
        </div>

      </div>

      {/* Multi-Step Account Recovery Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <KeyRound size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-gray-900">
                    {recoveryStep === "email" && "Reset Your Password"}
                    {recoveryStep === "code_password" && "Enter Code & New Password"}
                    {recoveryStep === "success" && "Password Reset Complete"}
                  </h3>
                  <p className="text-xs text-gray-400">
                    {recoveryStep === "email" && "Step 1 of 2: Verify registered email"}
                    {recoveryStep === "code_password" && "Step 2 of 2: Set your new password"}
                    {recoveryStep === "success" && "Account recovered successfully"}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowForgotModal(false)}
                className="p-1.5 rounded-xl text-gray-400 hover:text-gray-900 hover:bg-gray-100 transition"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message Box */}
            {recoveryError && (
              <div className="mt-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                <AlertCircle size={15} className="shrink-0 mt-0.5" />
                <div className="flex-1 leading-relaxed">{recoveryError}</div>
              </div>
            )}

            {/* STEP 1: Enter Email */}
            {recoveryStep === "email" && (
              <form onSubmit={handleRequestCode} className="mt-5 space-y-4">
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
                  Enter your registered account email. We will generate a secure 6-digit verification code to reset your password.
                </p>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Account Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full rounded-2xl border border-gray-200 py-3.5 pl-11 pr-4 text-sm font-medium outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-3 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading}
                    className="flex-1 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {recoveryLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Generating Code...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        Send 6-Digit Code
                        <ArrowRight size={14} />
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: Enter Code & New Password */}
            {recoveryStep === "code_password" && (
              <form onSubmit={handleResetPassword} className="mt-5 space-y-4">
                {/* Email Chip */}
                <div className="flex items-center justify-between bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
                  <span className="text-gray-500">
                    Code sent to: <strong className="text-gray-800">{forgotEmail}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryStep("email");
                      setRecoveryError("");
                    }}
                    className="text-orange-600 font-bold hover:underline"
                  >
                    Change
                  </button>
                </div>

                {/* Demo Helper Badge */}
                {generatedCodeDemo && (
                  <div className="p-3 bg-amber-50 border border-amber-200/80 rounded-2xl text-xs flex items-center justify-between">
                    <div>
                      <p className="text-amber-800 font-bold">Verification Code Generated:</p>
                      <p className="font-mono text-sm font-black text-amber-950 mt-0.5 tracking-wider">
                        {generatedCodeDemo}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setResetCode(generatedCodeDemo)}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs shadow-xs transition"
                    >
                      Auto-fill Code
                    </button>
                  </div>
                )}

                {/* 6-Digit Code Input */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
                      6-Digit Verification Code
                    </label>
                    <button
                      type="button"
                      onClick={handleResendCode}
                      disabled={resendTimer > 0 || recoveryLoading}
                      className="text-xs font-bold text-orange-600 hover:text-orange-700 disabled:opacity-50 disabled:text-gray-400"
                    >
                      {resendTimer > 0 ? `Resend code (${resendTimer}s)` : "Resend code"}
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="text"
                      maxLength={6}
                      required
                      value={resetCode}
                      onChange={(e) => setResetCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      placeholder="e.g. 123456"
                      className="w-full font-mono text-center tracking-[0.4em] font-black text-lg rounded-2xl border border-gray-200 py-3 pl-11 pr-4 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                {/* New Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    New Strong Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-11 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password Input */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      className="w-full rounded-2xl border border-gray-200 py-3 pl-11 pr-4 text-sm outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                {/* Live Password Checklist */}
                <div className="bg-gray-50 border border-gray-200/80 p-3.5 rounded-2xl space-y-1.5">
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                    <ShieldCheck size={14} className={isRecPasswordValid ? "text-emerald-500" : "text-amber-500"} />
                    Password Requirements
                  </p>
                  <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                    <div className={`flex items-center gap-1.5 ${recMinLength ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${recMinLength ? "bg-emerald-500" : "bg-gray-300"}`} />
                      8+ characters
                    </div>
                    <div className={`flex items-center gap-1.5 ${recUpper ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${recUpper ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Uppercase (A-Z)
                    </div>
                    <div className={`flex items-center gap-1.5 ${recLower ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${recLower ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Lowercase (a-z)
                    </div>
                    <div className={`flex items-center gap-1.5 ${recNumber && recSpecial ? "text-emerald-600 font-bold" : "text-gray-400"}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${recNumber && recSpecial ? "bg-emerald-500" : "bg-gray-300"}`} />
                      Number & Special
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setRecoveryStep("email")}
                    className="py-3 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={recoveryLoading || !isRecPasswordValid || resetCode.length !== 6}
                    className="flex-1 py-3.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                  >
                    {recoveryLoading ? (
                      <span className="flex items-center gap-2">
                        <RefreshCw size={14} className="animate-spin" />
                        Updating Password...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5">
                        <Check size={14} />
                        Update & Reset Password
                      </span>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Success Screen */}
            {recoveryStep === "success" && (
              <div className="mt-6 text-center space-y-4 py-2">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20">
                  <CheckCircle2 size={36} />
                </div>
                <h4 className="text-xl font-black text-gray-900">
                  Password Reset Successfully! 🎉
                </h4>
                <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                  Your new password has been safely updated. You can now log into your account using your new password.
                </p>

                <div className="pt-3">
                  <button
                    type="button"
                    onClick={handleFinishRecovery}
                    className="w-full py-4 rounded-2xl bg-gray-950 hover:bg-orange-600 text-white font-bold text-sm shadow-xl transition cursor-pointer"
                  >
                    Proceed to Sign In
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}