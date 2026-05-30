import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import SpecialNavbar from "./components/SpecialNavbar";
import { ToastProvider } from "./components/ToastContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Welcome from "./pages/Welcome";
import ProtectedRoute from './components/ProtectedRoute';
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import SpecialJob from "./pages/SpecialJob";
import AddAmount from "./pages/AddAmount";
import AdminLogin from "./pages/AdminLogin";
import AdminPanel from "./pages/AdminPanelNew";
import ExamPage from './pages/ExamPage';
import ProtectedExamRoute from './components/ProtectedExamRoute';
import ExamLoginPage from './pages/ExamLoginPage';
import "./App.css";
import Payment from "./pages/Payment";
import AccountDetails from "./pages/AccountDetails";
import WalletTransfer from "./pages/WalletTransfer";
import ReferralLanding from "./pages/ReferralLanding";
import ReferralRegister from "./pages/ReferralRegister";
import ReferralList from "./pages/ReferralList";
import MyEarnings from "./pages/MyEarnings";

function App() {
  return (
    <Router>
      <ToastProvider>
      <div>
        
        <Routes>
          <Route
            path="/"
            element={
              <>
                <Navbar />
                <Home />
                <footer>
                  <p>© 2025 JobPortal. All Rights Reserved.</p>
                </footer>
              </>
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/welcome"
            element={
              <ProtectedRoute>
                <SpecialNavbar />
                <Welcome />
              </ProtectedRoute>
            }
          />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/special-job" element={<ProtectedRoute><SpecialJob /></ProtectedRoute>} />
          <Route path="/add-amount" element={<ProtectedRoute><AddAmount /></ProtectedRoute>} />
          <Route path="/exam" element={<ProtectedExamRoute><ExamPage /></ProtectedExamRoute>} />
          <Route path="/exam-login" element={<ExamLoginPage />} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountDetails /></ProtectedRoute>} />
          <Route path="/wallet-transfer" element={<ProtectedRoute><WalletTransfer /></ProtectedRoute>} />
          <Route path="/referral" element={<ProtectedRoute><ReferralLanding /></ProtectedRoute>} />
          <Route path="/referral/register" element={<ProtectedRoute><ReferralRegister /></ProtectedRoute>} />
          <Route path="/referrals" element={<ProtectedRoute><ReferralList /></ProtectedRoute>} />
          <Route path="/earnings" element={<ProtectedRoute><MyEarnings /></ProtectedRoute>} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </div>
      </ToastProvider>
    </Router>
  );
}

export default App;
