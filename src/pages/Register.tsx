
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, ShoppingBag, UserRound, LockKeyhole } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

export default function Register() {
  const navigate = useNavigate();
  const { setSession } = useAuth();

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

  const validate = () => {
    const newErrors: Record<string, string> = {};

    if (name.trim().length < 2) {
      newErrors.name = "Please enter your full name";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Enter a valid email address";
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
      newErrors.terms = "Please accept the terms to continue";
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
        setApiError(data.message || "Registration failed");
        return;
      }

      if (!data.token || !data.user) {
        setApiError("Invalid response from server. Please try again.");
        return;
      }

      setSession(data.user, data.token);
      navigate("/account");
    } catch (error) {
      console.error("Registration error:", error);
      setApiError("Unable to connect to server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-xl md:grid md:grid-cols-2">

        <div className="hidden bg-linear-to-br from-indigo-700 via-violet-700 to-purple-800 p-12 text-white md:flex md:flex-col md:justify-between">
          <Link to="/" className="flex items-center gap-2 text-2xl font-bold">
            <ShoppingBag size={30} />
            NOVA
          </Link>

          <div>
            <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-indigo-200">
              Join NOVA
            </p>
            <h1 className="text-4xl font-bold leading-tight">
              Discover a better way to shop.
            </h1>
            <p className="mt-5 leading-7 text-indigo-100">
              Create your account and keep your favorite products and shopping
              experience in one place.
            </p>
          </div>

          <p className="text-sm text-indigo-200">
            © 2026 NOVA. All rights reserved.
          </p>
        </div>

        <div className="px-6 py-10 sm:px-12 md:py-12">
          <Link
            to="/"
            className="mb-8 inline-flex items-center gap-2 text-xl font-bold text-indigo-700 md:hidden"
          >
            <ShoppingBag size={25} />
            NOVA
          </Link>

          <div className="mb-7">
            <h2 className="text-3xl font-bold text-gray-900">
              Create Account
            </h2>
            <p className="mt-2 text-gray-500">
              Sign up to start shopping with NOVA.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <div className="relative">
                <UserRound className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Muhammad Ali"
                  className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.name ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

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
                  className={`w-full rounded-xl border py-3 pl-11 pr-4 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.email ? "border-red-500" : "border-gray-200"
                  }`}
                />
              </div>
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
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
                  placeholder="Create a strong password"
                  className={`w-full rounded-xl border py-3 pl-11 pr-12 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.password ? "border-red-500" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <div className="relative">
                <LockKeyhole className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={19} />
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className={`w-full rounded-xl border py-3 pl-11 pr-12 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-100 ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirm ? <EyeOff size={19} /> : <Eye size={19} />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            <div>
              <label className="flex items-start gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-1 accent-indigo-600"
                />
                <span>
                  I agree to the Terms of Service and Privacy Policy.
                </span>
              </label>
              {errors.terms && <p className="mt-1 text-sm text-red-600">{errors.terms}</p>}
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
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-800">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}