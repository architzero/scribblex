const Login = () => {
  const handleGoogleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:4000";
    window.location.href = `${backendUrl}/auth/google`;
  };

  return (
    <div className="page-shell auth-center">
      <div className="glass-card">
        <h1 className="brand-title">ScribbleX</h1>
        <p className="text-muted">
          Brainstorm in real time with your team. Draw, write, and shape ideas together.
        </p>

        <button className="btn btn-primary" onClick={handleGoogleLogin}>
          Continue with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
