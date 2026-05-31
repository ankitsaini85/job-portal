import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css"; // import the signup-specific CSS
import { useToast } from '../components/ToastContext';
import { buildUrl } from '../config/api';
import signupImage from '../images/company-logo.png';
const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [photoFile, setPhotoFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({ name: '', email: '', password: '', phone: '' });
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
    const nextErrors = { name: '', email: '', password: '', phone: '' };
    if (!name || name.trim().length < 2) nextErrors.name = 'Name is required (min 2 characters)';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = 'A valid email is required';
    if (!password || password.length < 8) nextErrors.password = 'Password must be at least 8 characters';
    if (!phone || !/^\d{10}$/.test(phone)) nextErrors.phone = 'Phone must be 10 digits';
    setErrors(nextErrors);
    if (nextErrors.name || nextErrors.email || nextErrors.password || nextErrors.phone) return;
    setLoading(true);
    try {

  const fd = new FormData();
      fd.append('name', name);
      fd.append('email', email);
      fd.append('password', password);
  fd.append('phone', phone);
      if (photoFile) fd.append('photo', photoFile);

      const res = await fetch(buildUrl('/api/auth/signup'), {
        method: "POST",
        body: fd
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Signup failed");
      localStorage.setItem("token", data.token);
      // persist user info for welcome page
      try {
        localStorage.setItem("user", JSON.stringify(data.user || {}));
      } catch (e) {
        // ignore storage errors
      }
      // non-blocking toast on success
      toast(data.message || `Signup successful. Welcome, ${data.user?.name || data.user?.email || 'user'}!`, { type: 'success' });
      navigate("/welcome");
    } catch (err) {
      toast(err.message || 'Signup failed', { type: 'error' });
    }
    finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        {/* <h2>Sign Up</h2> */}
        <img className="signup-image" src={signupImage} alt="company-logo" />
        <form onSubmit={handleSubmit} encType="multipart/form-data" noValidate>
          <input value={name} onChange={(e) => { setName(e.target.value); setErrors(e => ({ ...e, name: '' })); }} type="text" placeholder="Name" aria-label="Name" />
          {errors.name && <div className="error-text" style={{ marginTop: 6 }}>{errors.name}</div>}

          <input value={email} onChange={(e) => { setEmail(e.target.value); setErrors(e => ({ ...e, email: '' })); }} type="email" placeholder="Email" aria-label="Email" />
          {errors.email && <div className="error-text" style={{ marginTop: 6 }}>{errors.email}</div>}

          <input value={password} onChange={(e) => { setPassword(e.target.value); setErrors(e => ({ ...e, password: '' })); }} type="password" placeholder="Password" aria-label="Password" />
          {errors.password && <div className="error-text" style={{ marginTop: 6 }}>{errors.password}</div>}

          <input value={phone} onChange={(e) => { setPhone(e.target.value); setErrors(e => ({ ...e, phone: '' })); }} type="text" placeholder="Phone number (10 digits)" aria-label="Phone" />
          {errors.phone && <div className="error-text" style={{ marginTop: 6 }}>{errors.phone}</div>}

          <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files?.[0] || null)} />
          <button type="submit" disabled={loading || !!errors.name || !!errors.email || !!errors.password || !!errors.phone}>{loading ? "Signing up..." : "Sign Up"}</button>
        </form>
        <div className="auth-links">
          Already registered? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
