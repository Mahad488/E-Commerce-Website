import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LogOut, ShoppingBag, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { API_BASE_URL } from "../config/api";

interface ProfileUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

export default function Account() {
  const { user, token, logout, setSession } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!token) {
        logout();
        navigate("/login");
        return;
      }

      try {
        const response = await fetch(
          `${API_BASE_URL}/api/auth/profile`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          logout();
          navigate("/login");
          return;
        }

        setProfile(data.user);

        // Keep AuthContext user data synchronized
        setSession(
          {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
          },
          token
        );
      } catch (error) {
        console.error("Profile fetch error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token, logout, navigate, setSession]);

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-indigo-600" />
          <p className="mt-4 text-sm text-gray-500">
            Loading your account...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
          <Link
            to="/"
            className="flex items-center gap-2 text-2xl font-bold text-indigo-700"
          >
            <ShoppingBag size={27} />
            NOVA
          </Link>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <LogOut size={17} />
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-12">
        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-700">
            <UserRound size={32} />
          </div>

          <p className="text-sm font-medium text-indigo-600">
            Your account
          </p>

          <h1 className="mt-2 text-3xl font-bold text-gray-900">
            Welcome, {profile?.name || user?.name || "Customer"}!
          </h1>

          <p className="mt-2 text-gray-500">
            You are currently signed in as{" "}
            {profile?.email || user?.email}.
          </p>

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-5">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">
              Account Information
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium text-gray-900">
                  {profile?.name || user?.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-900">
                  {profile?.email || user?.email}
                </p>
              </div>

              {profile?.created_at && (
                <div>
                  <p className="text-sm text-gray-500">
                    Member Since
                  </p>
                  <p className="font-medium text-gray-900">
                    {new Date(
                      profile.created_at
                    ).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/products"
              className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
            >
              Continue Shopping
            </Link>

            <Link
              to="/cart"
              className="rounded-xl border border-gray-200 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
            >
              View Cart
            </Link>
          </div>

          <p className="mt-8 rounded-lg bg-green-50 p-4 text-sm text-green-800">
            Your account is securely connected to the NOVA backend
            using JWT authentication.
          </p>
        </div>
      </main>
    </div>
  );
}