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
  }, []);

  return <div>Processing login...</div>;
};

export default AuthCallback;
