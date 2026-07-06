import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API = import.meta.env.VITE_API_URL;

export default function VerifyOTP() {

  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const verifyOtp = async () => {

    try {

      const email =
        localStorage.getItem("email");

      const res = await axios.post(
        `${API}/api/auth/verify-otp`,
        {
          email,
          otp
        }
      );

      localStorage.setItem(
        "token",
        res.data.token
      );

      localStorage.removeItem("email");

      const payload = JSON.parse(atob(res.data.token.split(".")[1]));
      if (payload.role === "admin") {
        navigate("/dashboard");   // Admin dashboard
      } else {
        navigate("/home");         // Faculty goes to home/create report
      }

    } catch (err) {

      setError(
        err.response?.data?.message ||
        "OTP Verification Failed"
      );
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, #0b0d1e 0%, #0f1940 40%, #1a0a3b 100%)",
      }}
    >
      {/* Background Orbs */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600,
          height: 600,
          borderRadius: "50%",
          top: "-200px",
          right: "-200px",
          background:
            "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        }}
      />

      <div
        className="absolute pointer-events-none"
        style={{
          width: 500,
          height: 500,
          borderRadius: "50%",
          bottom: "-150px",
          left: "-150px",
          background:
            "radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Grid Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(rgba(99,179,237,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(99,179,237,0.07) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Card */}
      <div
        className="relative w-full max-w-md rounded-3xl p-8 md:p-10"
        style={{
          background: "rgba(15,20,55,0.85)",
          border: "1px solid rgba(255,255,255,0.12)",
          backdropFilter: "blur(24px)",
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05) inset",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
            style={{
              background:
                "linear-gradient(135deg,#3b82f6,#6366f1)",
              boxShadow:
                "0 8px 24px rgba(99,102,241,0.5)",
            }}
          >
            <svg
              className="w-7 h-7 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m5-2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>

          <h2
            className="text-2xl font-bold text-white mb-2"
            style={{ fontFamily: "'Georgia', serif" }}
          >
            Verify OTP
          </h2>

          <p className="text-sm text-blue-300/60">
            Enter the OTP sent to your email
          </p>
        </div>

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2 px-4 py-3 rounded-xl mb-5 text-sm"
            style={{
              background: "rgba(239,68,68,0.12)",
              border: "1px solid rgba(239,68,68,0.3)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="mb-6">
          <label
            className="block text-xs font-semibold text-blue-200/70 mb-2 tracking-wide uppercase"
            style={{ letterSpacing: "0.08em" }}
          >
            One Time Password
          </label>

          <input
            type="text"
            placeholder="Enter 6-digit OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full px-4 py-3.5 rounded-xl text-white text-center text-lg tracking-[0.3em] outline-none"
            style={{
              background: "rgba(255,255,255,0.07)",
              border: "1.5px solid rgba(255,255,255,0.14)",
            }}
          />
        </div>

        {/* Verify Button */}
        <button
          onClick={verifyOtp}
          className="w-full py-3.5 rounded-xl font-semibold text-sm text-white transition-all duration-300 hover:scale-[1.02]"
          style={{
            background:
              "linear-gradient(135deg,#3b82f6,#6366f1)",
            boxShadow:
              "0 8px 28px rgba(99,102,241,0.45)",
          }}
        >
          Verify OTP
        </button>

        {/* Footer */}
        <p
          className="text-center text-sm mt-6"
          style={{ color: "rgba(148,163,184,0.7)" }}
        >
          Check your inbox and spam folder for the OTP.
        </p>
      </div>
    </div>
  );
}