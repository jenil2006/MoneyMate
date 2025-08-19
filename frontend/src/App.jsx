import { useEffect, useState } from 'react';
import axiosInstance from './api/axios';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Analytics from './pages/Analytics';
import InvestmentPlanning from './pages/InvestmentPlanning';
import AccountSettings from './pages/AccountSettings';
function App() {
  return (
    <>
      <Toaster position="top-right" reverseOrder={false} />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgotpassword" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/investment-planning" element={<InvestmentPlanning/>}/>
          <Route path="/account-settings" element={<AccountSettings />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
