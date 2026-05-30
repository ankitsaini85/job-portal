import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
 // import logo from '../../public/company-logo.png'
 import companyLogo from '../images/company-logo.png';
const Navbar = () => {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState(() => !!localStorage.getItem("token"));
  const [name, setName] = useState(() => {
    try {
      const u = JSON.parse(localStorage.getItem("user") || "{}");
      return u?.name || u?.email || null;
    } catch (e) {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "token" || e.key === "user") {
        setLoggedIn(!!localStorage.getItem("token"));
        try {
          const u = JSON.parse(localStorage.getItem("user") || "{}");
          setName(u?.name || u?.email || null);
        } catch (err) {
          setName(null);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    } catch (e) {}
    setLoggedIn(false);
    setName(null);
    navigate("/");
  };

  return (
    <nav className="navbar">
        <Link to="/" className="navbar-brand">
          {/* logo.png should be placed in the project's public/ folder */}
          <img 
            src={companyLogo}
            alt="Company logo"
            className="navbar-logo"
          />
        </Link>
      <ul>
        <li><a href="#about">About</a></li>
        <li><a href="#services">Services</a></li>
        <li><a href="#contact">Contact</a></li>
        {!loggedIn ? (
          <li>
            <Link to="/login">
              <button>Login</button>
            </Link>
          </li>
        ) : (
          <>
            <li style={{ marginRight: 8, alignSelf: "center" }}>
              <span>Hi{ name ? `, ${name}` : '' }</span>
            </li>
            <li>
              <button onClick={handleLogout}>Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
