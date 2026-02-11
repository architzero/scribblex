import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async () => {
    setError(null);
    const email = localStorage.getItem("pendingEmail");

    if (!email) {
      setError("Session expired. Please sign in again.");
      return;
    }

    if (otp.trim().length !== 6) {
      setError("Enter a valid 6-digit OTP code.");
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.post("/auth/verify-otp", {
        email,
        otp: otp.trim(),
      });

      setToken(res.data.token);
      localStorage.removeItem("pendingEmail");
      navigate("/dashboard");
    } catch {
      setError("Invalid or expired OTP. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-shell auth-center">
      <div className="glass-card">
        <h2 style={{ marginTop: 0 }}>Verify your login</h2>
        <p className="text-muted">We sent a 6-digit OTP to your Gmail address.</p>
        <input
          className="input"
          maxLength={6}
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
        />
        <button className="btn btn-primary" onClick={handleVerify} disabled={isSubmitting}>
          {isSubmitting ? "Verifying..." : "Verify OTP"}
        </button>
        {error ? <p className="feedback">{error}</p> : null}
      </div>
    </div>
  );
};

export default VerifyOTP;
