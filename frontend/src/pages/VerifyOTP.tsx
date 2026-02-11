import React, { useState } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const VerifyOTP = () => {
  const [otp, setOtp] = useState("");
  const { setToken } = useAuth();
  const navigate = useNavigate();

  const handleVerify = async () => {
    try {
      const email = localStorage.getItem("pendingEmail");

      const res = await api.post("/auth/verify-otp", {
        email,
        otp,
      });

      setToken(res.data.token);
      navigate("/dashboard");
    } catch (err) {
      alert("Invalid OTP");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2>Enter OTP</h2>
        <input
          style={styles.input}
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button style={styles.button} onClick={handleVerify}>
          Verify
        </button>
      </div>
    </div>
  );
};

const styles: any = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh",
    background: "#0f172a",
  },
  card: {
    background: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    textAlign: "center",
    width: "320px",
  },
  input: {
    width: "100%",
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "8px",
    border: "none",
    outline: "none",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#22c55e",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default VerifyOTP;
