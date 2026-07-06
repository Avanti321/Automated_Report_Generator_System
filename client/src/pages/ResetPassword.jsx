import { useState } from "react";
import axios from "axios";
import { Link, useSearchParams } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

const PWD_RULES = "Password must be 8–12 characters long.";

export default function ResetPassword() {
  const [searchParams]            = useSearchParams();
  const token                     = searchParams.get("token");
  const email                     = searchParams.get("email");

  const [newPassword, setNew]     = useState("");
  const [confirmPwd, setConfirm]  = useState("");
  const [showNew, setShowNew]     = useState(false);
  const [showConfirm, setShowCfm] = useState(false);
  const [focused, setFocused]     = useState("");
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const [loading, setLoading]     = useState(false);

  const inputStyle = (field) => ({
    background: focused === field ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
    border: focused === field ? "1.5px solid rgba(147,197,253,0.7)" : "1.5px solid rgba(255,255,255,0.14)",
    transition: "all 0.25s ease",
    color: "white",
    outline: "none",
    boxShadow: focused === field ? "0 0 0 3px rgba(99,179,237,0.15)" : "none",
  });

  const pwdStrength = (p) => {
    if (!p) return null;
    if (p.length < 8) return { label: "Too short", color: "#ef4444", width: "25%" };
    if (p.length <= 10) return { label: "Fair", color: "#f59e0b", width: "60%" };
    if (p.length <= 12) return { label: "Good", color: "#22c55e", width: "100%" };
    return { label: "Too long", color: "#ef4444", width: "100%" };
  };

  const strength = pwdStrength(newPassword);

  const submit = async () => {
    setError(""); setSuccess("");
    if (!newPassword || !confirmPwd) { setError("All fields are required."); return; }
    if (newPassword.length < 8 || newPassword.length > 12) { setError(PWD_RULES); return; }
    if (newPassword !== confirmPwd) { setError("Passwords do not match."); return; }
    if (!token || !email) { setError("Invalid or missing reset link. Please request a new one."); return; }

    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/reset-password`, { email, token, newPassword });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0b0d1e 0%, #0f1940 40%, #1a0a3b 100%)" }}
    >
      <div className="absolute pointer-events-none" style={{ width: 600, height: 600, borderRadius: "50%", top: "-200px", right: "-200px", background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, borderRadius: "50%", bottom: "-150px", left: "-150px", background: "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)" }} />
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{ backgroundImage: "linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)", backgroundSize: "50px 50px" }} />

      <div
        className="relative w-full max-w-md rounded-3xl p-8 md:p-10"
        style={{ background: "rgba(15,20,55,0.85)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(24px)", boxShadow: "0 32px 80px rgba(0,0,0,0.6)" }}
      >
        {/* Header */}
        <div className="text-center mb-9">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 8px 24px rgba(99,102,241,0.5)" }}>
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>Reset Password</h2>
          <p className="text-sm text-blue-300/60">Create a new secure password (8–12 characters)</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", color: "#fca5a5" }}>
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Success */}
        {success ? (
          <div>
            <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
              <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {success}
            </div>
            <Link
              to="/login"
              className="block w-full text-center py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 8px 28px rgba(99,102,241,0.45)" }}
            >
              Go to Login →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {/* New Password */}
            <div>
              <label className="block text-xs font-semibold text-blue-200/70 mb-2 tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
                New Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: focused === "new" ? "#93c5fd" : "rgba(148,163,184,0.5)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  type={showNew ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={12}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-500"
                  style={inputStyle("new")}
                  onFocus={() => setFocused("new")}
                  onBlur={() => setFocused("")}
                  onChange={e => setNew(e.target.value)}
                />
                <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showNew
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>

              {/* Strength bar */}
              {strength && (
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-xs" style={{ color: "rgba(148,163,184,0.6)" }}>Strength</span>
                    <span className="text-xs font-medium" style={{ color: strength.color }}>{strength.label}</span>
                  </div>
                  <div className="h-1 rounded-full" style={{ background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-1 rounded-full transition-all duration-300" style={{ width: strength.width, background: strength.color }} />
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-blue-200/70 mb-2 tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: focused === "confirm" ? "#93c5fd" : "rgba(148,163,184,0.5)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <input
                  type={showConfirm ? "text" : "password"}
                  placeholder="••••••••"
                  minLength={8}
                  maxLength={12}
                  className="w-full pl-10 pr-11 py-3.5 rounded-xl text-sm placeholder-slate-500"
                  style={inputStyle("confirm")}
                  onFocus={() => setFocused("confirm")}
                  onBlur={() => setFocused("")}
                  onChange={e => setConfirm(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
                <button type="button" onClick={() => setShowCfm(!showConfirm)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: "rgba(148,163,184,0.5)" }}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    {showConfirm
                      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      : <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></>
                    }
                  </svg>
                </button>
              </div>
              {/* Match indicator */}
              {confirmPwd && (
                <p className="text-xs mt-1.5" style={{ color: confirmPwd === newPassword ? "#86efac" : "#fca5a5" }}>
                  {confirmPwd === newPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                </p>
              )}
            </div>

            {/* Hint */}
            <p className="text-xs px-1" style={{ color: "rgba(148,163,184,0.5)" }}>
              Password must be 8–12 characters long.
            </p>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.02] disabled:opacity-60 disabled:scale-100 relative overflow-hidden group"
              style={{ background: "linear-gradient(135deg,#3b82f6,#6366f1)", boxShadow: "0 8px 28px rgba(99,102,241,0.45)" }}
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Resetting...
                  </>
                ) : (
                  <>
                    Reset Password
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </div>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        <p className="text-center text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>
          Back to{" "}
          <Link to="/login" className="font-semibold" style={{ color: "#93c5fd" }}
            onMouseEnter={e => e.target.style.color = "#bfdbfe"}
            onMouseLeave={e => e.target.style.color = "#93c5fd"}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
