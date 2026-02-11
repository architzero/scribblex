import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  title?: string;
}

const Navbar = ({ title = "Collaborate visually, together." }: NavbarProps) => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    localStorage.removeItem("pendingEmail");
    navigate("/");
  };

  return (
    <header className="navbar">
      <div>
        <div className="brand">ScribbleX</div>
        <div className="text-muted">{title}</div>
      </div>
      <button className="btn btn-primary" style={{ width: "auto", marginTop: 0 }} onClick={handleLogout}>
        Logout
      </button>
    </header>
  );
};

export default Navbar;
