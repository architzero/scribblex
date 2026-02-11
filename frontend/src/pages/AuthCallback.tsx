import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const email = searchParams.get("email");

    if (!email) {
      navigate("/");
      return;
    }

    localStorage.setItem("pendingEmail", email);
    navigate("/verify");
  }, [navigate, searchParams]);

  return (
    <div className="page-shell auth-center">
      <div className="glass-card">
        <h2 style={{ marginTop: 0 }}>Finalizing sign-in</h2>
        <p className="text-muted">Redirecting you to OTP verification...</p>
      </div>
    </div>
  );
};

export default AuthCallback;
