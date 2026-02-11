import { Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import VerifyOTP from "./pages/VerifyOTP";
import Dashboard from "./pages/Dashboard";
import { useAuth } from "./context/AuthContext";
import AuthCallback from "./pages/AuthCallback";



function App() {
  const { token } = useAuth();

  return (
    <div style={{ background: "#0f172a", minHeight: "100vh", color: "white" }}>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/verify" element={<VerifyOTP />} />
        <Route
          path="/dashboard"
          element={token ? <Dashboard /> : <Navigate to="/" />}
        />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
    </div>
  );
}

export default App;
