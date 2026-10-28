import { Component, type ReactNode } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Admin from "../Admin";
import AdminLogin from "../AdminLogin";
import AdminPortalData from "../AdminPortalData";
import { ToastProvider } from "../../../src/context/ToastContext";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Admin Portal ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
              ⚠
            </div>
            <h1 className="text-xl font-bold mb-2">Portal Interface Notice</h1>
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              {this.state.error?.message || "An unexpected error occurred while rendering the portal."}
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => {
                  this.setState({ hasError: false });
                  window.location.reload();
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                Reload Page
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem("nova_admin_token");
                  window.location.href = "/admin-login";
                }}
                className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition"
              >
                Go to Login
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const token = localStorage.getItem("nova_admin_token");
  if (!token || token === "demo_admin_preview_token") {
    return <Navigate to="/admin-login" replace />;
  }
  return <>{children}</>;
}

export default function AdminApp() {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Direct visitors to login first */}
            <Route path="/" element={<Navigate to="/admin-login" replace />} />
            <Route path="/login" element={<Navigate to="/admin-login" replace />} />
            <Route path="/admin-login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedAdminRoute>
                  <Admin />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/admin-data"
              element={
                <ProtectedAdminRoute>
                  <AdminPortalData />
                </ProtectedAdminRoute>
              }
            />
            <Route
              path="/data"
              element={
                <ProtectedAdminRoute>
                  <AdminPortalData />
                </ProtectedAdminRoute>
              }
            />
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/admin-login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
}
