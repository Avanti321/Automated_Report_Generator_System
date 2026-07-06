import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function ForgotPassword() {
  const [email, setEmail]     = useState("");
  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);

  const inputStyle = {
    background: focused ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.07)",
    border: focused ? "1.5px solid rgba(147,197,253,0.7)" : "1.5px solid rgba(255,255,255,0.14)",
    transition: "all 0.25s ease",
    color: "white",
    outline: "none",
    boxShadow: focused ? "0 0 0 3px rgba(99,179,237,0.15)" : "none",
  };

  const submit = async () => {
    setError(""); setSuccess("");
    if (!email) { setError("Please enter your email address."); return; }
    setLoading(true);
    try {
      const res = await axios.post(`${API}/api/auth/forgot-password`, { email });
      setSuccess(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
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
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>Forgot Password</h2>
          <p className="text-sm text-blue-300/60">Enter your email to receive a reset link</p>
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
        {success && (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-6 text-sm" style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#86efac" }}>
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            {success}
          </div>
        )}

        {!success && (
          <>
            <div className="mb-5">
              <label className="block text-xs font-semibold text-blue-200/70 mb-2 tracking-wide uppercase" style={{ letterSpacing: "0.08em" }}>
                Email Address
              </label>
              <div className="relative">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4" style={{ color: focused ? "#93c5fd" : "rgba(148,163,184,0.5)" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  type="email"
                  placeholder="faculty@college.edu"
                  className="w-full pl-10 pr-4 py-3.5 rounded-xl text-sm placeholder-slate-500"
                  style={inputStyle}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && submit()}
                />
              </div>
            </div>

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
                    Sending link...
                  </>
                ) : (
                  <>
                    Send Reset Link
                    <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </>
                )}
              </span>
            </button>
          </>
        )}

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
          <span className="text-xs text-slate-500">or</span>
          <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.1)" }} />
        </div>

        <p className="text-center text-sm" style={{ color: "rgba(148,163,184,0.7)" }}>
          Remember your password?{" "}
          <Link to="/login" className="font-semibold transition-colors duration-200" style={{ color: "#93c5fd" }}
            onMouseEnter={e => e.target.style.color = "#bfdbfe"}
            onMouseLeave={e => e.target.style.color = "#93c5fd"}>
            Sign in →
          </Link>
        </p>
      </div>
    </div>
  );
}
