import { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState("");
  const navigate = useNavigate();

  const inputStyle = (field) => ({
    background: focused === field ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
    border: focused === field
      ? "1.5px solid rgba(147,197,253,0.7)"
      : "1.5px solid rgba(255,255,255,0.14)",
    transition: "all 0.25s ease",
    color: "white",
    outline: "none",
    boxShadow: focused === field ? "0 0 0 3px rgba(99,179,237,0.15)" : "none",
  });

  const login = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      setError("Please enter both email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/admin-login`, form);
      localStorage.setItem("token", res.data.token);
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Admin login failed. Check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #1a0a0a 0%, #2a0f0f 40%, #1a0a3b 100%)" }}
    >
      <div className="absolute pointer-events-none" style={{ width: 600, height: 600, borderRadius: "50%", top: "-200px", right: "-200px", background: "radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, borderRadius: "50%", bottom: "-150px", left: "-150px", background: "radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.06) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      <div
        className="relative w-full max-w-md rounded-3xl p-8 md:p-10"
        style={{ background: "rgba(20,15,25,0.88)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset" }}
      >
        <div className="text-center mb-9">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#ef4444,#6366f1)", boxShadow: "0 8px 24px rgba(239,68,68,0.4)" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>Admin Login</h2>
          <p className="text-sm text-red-300/60">Restricted access — administrators only</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-red-200/70 mb-2 tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
              Admin Email
            </label>
            <input
              type="email"
              placeholder="admin@college.edu"
              required
              className="w-full px-4 py-3.5 rounded-xl text-sm placeholder-slate-500"
              style={inputStyle("email")}
              onFocus={() => setFocused("email")}
              onBlur={() => setFocused("")}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-red-200/70 mb-2 tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                className="w-full px-4 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-500"
                style={inputStyle("password")}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused("")}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2"
                style={{ color: "rgba(148,163,184,0.45)" }}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100"
            style={{ background: "linear-gradient(135deg,#ef4444,#6366f1)", boxShadow: "0 8px 28px rgba(239,68,68,0.4)" }}
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </form>

        <p className="text-center text-sm mt-8" style={{ color: "rgba(148,163,184,0.7)" }}>
          Not an admin?{" "}
          <Link to="/signup" className="font-semibold" style={{ color: "#93c5fd" }}>
            Go back
          </Link>
        </p>
      </div>
    </div>
  );
}
