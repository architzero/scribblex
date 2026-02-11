import React from "react";

const Login = () => {
  const handleGoogleLogin = () => {
    window.location.href = "http://localhost:4000/auth/google";
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>ScribbleX</h1>
        <p style={styles.subtitle}>Collaborative Drawing Rooms</p>

        <button style={styles.button} onClick={handleGoogleLogin}>
          Continue with Google
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
  title: {
    fontSize: "28px",
    marginBottom: "8px",
  },
  subtitle: {
    fontSize: "14px",
    color: "#94a3b8",
    marginBottom: "24px",
  },
  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "#6366f1",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  },
};

export default Login;
