import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck, Eye, EyeOff, Lock, User, ArrowLeft, Key } from "lucide-react";
import { API_BASE_URL } from "../../src/config/api";

export default function AdminLogin() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // If already authenticated with a valid token, redirect to admin
  useEffect(() => {
    const token = localStorage.getItem("nova_admin_token");
    if (token && token !== "demo_admin_preview_token") {
      navigate("/admin", { replace: true });
    } else {
      // Clear any invalid or demo tokens
      localStorage.removeItem("nova_admin_token");
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    if (!cleanUser || !cleanPass) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);

    try {
      let res;
      try {
        res = await fetch(`${API_BASE_URL}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUser, password: cleanPass }),
        });
      } catch {
        // Fallback to localhost:5000 or 127.0.0.1:5000 in case of port/host differences
        const altUrl = API_BASE_URL.includes("localhost")
          ? API_BASE_URL.replace("localhost", "127.0.0.1")
          : "http://localhost:5000";
        res = await fetch(`${altUrl}/api/admin/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: cleanUser, password: cleanPass }),
        });
      }

      const data = await res.json();

      if (res.ok && data.success && data.token) {
        localStorage.setItem("nova_admin_token", data.token);
        navigate("/admin", { replace: true });
        return;
      }

      // If credentials were wrong, show exact error and DO NOT log in
      setError(data.message || "Invalid username or password. Access denied.");
    } catch (err) {
      console.error("Admin login network error:", err);
      setError("Backend server is not running or unreachable on port 5000. Please start the backend server.");
    } finally {
      setLoading(false);
    }
  };

  const handleAutoFill = () => {
    setUsername("nova_admin");
    setPassword("Nova@Admin#2024");
    setError("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Top Back Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-orange-400 transition"
          >
            <ArrowLeft size={16} />
            <span>Back to Store</span>
          </Link>
        </div>

        {/* Logo / Badge */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500 rounded-2xl shadow-xl shadow-orange-500/30 mb-4 animate-badge-bounce">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Admin Portal</h1>
          <p className="text-gray-400 text-sm mt-1">NOVA Store — Restricted Access</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Error Message */}
            {error && (
              <div className="bg-rose-500/15 border border-rose-500/40 text-rose-300 text-xs px-4 py-3 rounded-xl leading-relaxed flex items-center gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>{error}</span>
              </div>
            )}

            {/* Username */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Admin Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="e.g. nova_admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-4 py-3.5 text-sm outline-none focus:border-orange-500 focus:bg-white/10 transition"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                Admin Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full bg-white/5 border border-white/10 text-white placeholder-gray-600 rounded-xl pl-10 pr-12 py-3.5 text-sm outline-none focus:border-orange-500 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition cursor-pointer"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 active:scale-95 disabled:opacity-50 text-white font-bold py-3.5 rounded-xl transition shadow-lg shadow-orange-500/30 text-sm mt-2 cursor-pointer flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Access Admin Dashboard →</span>
              )}
            </button>

            {/* Auto-fill Helper */}
            <div className="pt-2 border-t border-white/10 flex justify-center">
              <button
                type="button"
                onClick={handleAutoFill}
                className="py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-200 text-xs font-semibold flex items-center gap-1.5 transition border border-white/5 cursor-pointer"
              >
                <Key size={13} className="text-orange-400" />
                <span>Fill Default Credentials</span>
              </button>
            </div>
          </form>

          <p className="text-center text-gray-600 text-xs mt-6">
            Authorized personnel only. Credentials are strictly verified.
          </p>
        </div>
      </div>
    </div>
  );
}
