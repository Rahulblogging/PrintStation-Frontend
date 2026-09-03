import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">

      <Link to="/" className="logo">
        <span className="logo-icon">🖨️</span>
        <span>PrintStation</span>
      </Link>

      <div className="nav-links">
        <Link to="/" className="nav-link active">
          Print
        </Link>

        <Link to="/admin" className="nav-link">
          Admin
        </Link>
      </div>

    </nav>
  );
}

export default Navbar;