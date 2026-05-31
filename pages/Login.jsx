


import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css"; // import the login-specific CSS
import { useToast } from '../components/ToastContext';
import { buildUrl } from '../config/api';
import loginImage from '../images/company-logo.png';

const Login = () => {
  const [nameOrEmail, setNameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ nameOrEmail: '', password: '' });
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    document.body.style.paddingTop = "0";
    return () => {
      document.body.style.paddingTop = "70px";
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    // client-side validation
    const nextErrors = { nameOrEmail: '', password: '' };
    if (!nameOrEmail || nameOrEmail.trim().length === 0) nextErrors.nameOrEmail = 'Name or email is required';
    else if (nameOrEmail.includes('@') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nameOrEmail)) nextErrors.nameOrEmail = 'Enter a valid email address';
    if (!password || password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    setErrors(nextErrors);
    if (nextErrors.nameOrEmail || nextErrors.password) return;
    setLoading(true);
    try {
      // send as email if contains @ else as name
      const payload = nameOrEmail.includes("@")
        ? { email: nameOrEmail, password }
        : { name: nameOrEmail, password };

      const res = await fetch(buildUrl('/api/auth/login'), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      localStorage.setItem("token", data.token);
      // persist user info for welcome page
      try {
        localStorage.setItem("user", JSON.stringify(data.user || {}));
      } catch (e) {
        // ignore storage errors
      }
      // show non-blocking toast on successful login
      toast(data.message || `Welcome back, ${data.user?.name || data.user?.email || 'user'}!`, { type: 'success' });
      navigate("/welcome");
    } catch (err) {
      toast(err.message || 'Login failed', { type: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <img className="login-image" src={loginImage} alt="" />
        {/* <h2>Login</h2> */}
        <form onSubmit={handleSubmit} noValidate>
          <input value={nameOrEmail} onChange={(e) => { setNameOrEmail(e.target.value); setErrors(e => ({ ...e, nameOrEmail: '' })); }} type="text" placeholder="Name or Email" aria-label="Name or Email" />
          {errors.nameOrEmail && <div className="error-text" style={{ marginTop: 6 }}>{errors.nameOrEmail}</div>}

          <input value={password} onChange={(e) => { setPassword(e.target.value); setErrors(e => ({ ...e, password: '' })); }} type="password" placeholder="Password" aria-label="Password" />
          {errors.password && <div className="error-text" style={{ marginTop: 6 }}>{errors.password}</div>}

          <button type="submit" disabled={loading || !!errors.nameOrEmail || !!errors.password}>{loading ? "Logging in..." : "Login"}</button>
        </form>
        <div className="auth-links">
          <Link to="/forgot-password">Contact Support</Link>
        </div>
        <div className="auth-links">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

