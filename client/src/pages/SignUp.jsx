import { useNavigate } from "react-router-dom";

export default function SignUp() {
  const navigate = useNavigate();

  const cardStyle = {
    background: "rgba(15,20,55,0.85)",
    border: "1px solid rgba(255,255,255,0.12)",
    backdropFilter: "blur(24px)",
    boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04) inset",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #0b0d1e 0%, #0f1940 40%, #1a0a3b 100%)" }}
    >
      {/* Background orbs */}
      <div className="absolute pointer-events-none" style={{ width: 500, height: 500, borderRadius: "50%", top: "-150px", left: "-150px", background: "radial-gradient(circle, rgba(99,102,241,0.14) 0%, transparent 70%)" }} />
      <div className="absolute pointer-events-none" style={{ width: 600, height: 600, borderRadius: "50%", bottom: "-200px", right: "-200px", background: "radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)" }} />
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage: "linear-gradient(rgba(99,179,237,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.06) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      <div className="relative w-full max-w-md rounded-3xl p-8 md:p-10" style={cardStyle}>
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{ background: "linear-gradient(135deg,#6366f1,#3b82f6)", boxShadow: "0 8px 24px rgba(99,102,241,0.5)" }}
          >
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-1" style={{ fontFamily: "'Georgia', serif" }}>
            Activity Report System
          </h2>
          <p className="text-sm" style={{ color: "rgba(147,197,253,0.6)" }}>
            Continue as an Admin or as a Faculty member
          </p>
        </div>

        {/* Role choice */}
        <div className="space-y-4">
          <button
            type="button"
            onClick={() => navigate("/register")}
            className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] group"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.14)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "rgba(99,102,241,0.18)" }}>
              👨‍🏫
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Faculty</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                Create an account or sign in to submit activity reports
              </p>
            </div>
            <svg className="w-4 h-4 text-indigo-300 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          <button
            type="button"
            onClick={() => navigate("/admin-login")}
            className="w-full flex items-center gap-4 p-5 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02] group"
            style={{ background: "rgba(255,255,255,0.07)", border: "1.5px solid rgba(255,255,255,0.14)" }}
          >
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl" style={{ background: "rgba(99,102,241,0.18)" }}>
              🛡️
            </div>
            <div className="flex-1">
              <p className="text-white font-semibold text-sm">Admin</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(148,163,184,0.7)" }}>
                Sign in with your administrator credentials
              </p>
            </div>
            <svg className="w-4 h-4 text-indigo-300 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
