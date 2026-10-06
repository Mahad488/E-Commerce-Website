
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, LockKeyhole, Mail, ShoppingBag } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function Login() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
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
        setApiError(data.message || "Login failed");
        return;
      }

      if (!data.token || !data.user) {
        setApiError("Invalid response from server. Please try again.");
        return;
      }

      setSession(data.user, data.token);
      navigate("/account");
    } catch (error) {
      console.error("Login error:", error);
      setApiError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid md:grid-cols-2">

        {/* Left panel */}
        <div className="hidden bg-linear-to-br from-indigo-700 via-violet-700 to-purple-800 p-12 text-white md:flex md:flex-col md:justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag size={30} />
            NOVA
          </Link>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-200">
              Welcome back
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Your next favorite thing is waiting.
            </h1>
            <p className="mt-5 leading-7 text-indigo-100">
              Sign in to explore products, manage your cart, and enjoy a
              smoother shopping experience.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            © 2026 NOVA. All rights reserved.
          </p>
        </div>

        {/* Login form */}
        <div className="px-6 py-12 sm:px-12 md:py-16">
          <Link
            to="/"
            className="mb-10 inline-flex items-center gap-2 text-xl font-bold text-indigo-700 md:hidden"
          >
            <ShoppingBag size={25} />
            NOVA
          </Link>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900">
              Sign in to NOVA
            </h2>
            <p className="mt-2 text-gray-500">
              Enter your details to access your account.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className={`w-full rounded-xl border py-3.5 pl-11 pr-4 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`w-full rounded-xl border py-3.5 pl-11 pr-12 outline-none transition focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="accent-indigo-600" />
                Remember me
              </label>
              <button
                type="button"
                onClick={() => alert("Password recovery will be added later.")}
                className="font-medium text-indigo-600 hover:text-indigo-800"
              >
                Forgot password?
              </button>
            </div>

            {apiError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {apiError}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-indigo-600 py-3.5 font-semibold text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Create account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}