import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Wallet, Menu, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import axiosInstance from '../api/axios';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const [userName, setUserName] = useState("User");

  useEffect(() => {
    // Try to get username from JWT token
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        if (tokenPayload.username) {
          setUserName(tokenPayload.username);
        }
      }
    } catch (e) {
      console.log('Could not decode token for username');
    }
  }, []);

  const handleSignOut = () => {
    try {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      delete axiosInstance.defaults.headers['Authorization'];
    } finally {
      navigate('/login');
    }
  };

  return (
    <>
      {/* Desktop Navbar */}
      // in Navbar.jsx

{/* Desktop Navbar */}
<nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
  {/* This container sets the max-width, centers it, and adds padding */}
  {/* The padding (px-4...) is what aligns its content with the page below */}
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    
    {/* This flex container spaces out the three main groups */}
    <div className="flex justify-between items-center h-16">

      {/* Left: Logo and Brand Name */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">MoneyMate</span>
        </div>
      </div>

      {/* Center: Navigation Links */}
      <div className="hidden md:flex items-center space-x-1">
        <Link 
          to="/dashboard"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            location.pathname === '/dashboard'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Dashboard
        </Link>
        <Link 
          to="/transactions"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            location.pathname === '/transactions'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Transactions
        </Link>
        <Link 
          to="/analytics"
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            location.pathname === '/analytics'
              ? 'bg-purple-100 text-purple-700'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Analytics
        </Link>
        <Link 
      to="/investment-planning"
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        location.pathname === '/investment-planning'
          ? 'bg-purple-100 text-purple-700'
          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
      }`}
    >
      Investment
    </Link>
      </div>
      
      {/* Right: User Profile Dropdown */}
      <div className="hidden md:flex items-center">
        <div className="relative">
          <button 
            onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <img 
              src={`https://ui-avatars.com/api/?name=${userName}&background=6366f1&color=fff`}
              alt={userName}
              className="w-8 h-8 rounded-full"
            />
            <span className="text-sm font-medium text-gray-900">{userName}</span>
            <ChevronDown className="w-4 w-4 text-gray-600" />
          </button>
          
          {isUserDropdownOpen && (
  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
    <Link 
      to="/account-settings"
      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 block"
      onClick={() => setIsUserDropdownOpen(false)}
    >
      Account Settings
    </Link>
    <hr className="my-1" />
    <button onClick={handleSignOut} className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 block">
      Sign Out
    </button>
  </div>
)}
        </div>
      </div>

      {/* Mobile Menu Button */}
      <div className="md:hidden">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

    </div>
  </div>
</nav>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="relative flex flex-col w-full h-full max-w-xs bg-white shadow-xl">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img 
                  src={`https://ui-avatars.com/api/?name=${userName}&background=6366f1&color=fff`}
                  alt={userName}
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">{userName}</p>
                  <p className="text-xs text-gray-500">Welcome back!</p>
                </div>
              </div>
            </div>
            <nav className="flex-1 p-4 space-y-2">
              <Link 
                to="/dashboard"
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/dashboard'
                    ? 'text-purple-700 bg-purple-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Dashboard
              </Link>
              <Link 
                to="/transactions"
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/transactions'
                    ? 'text-purple-700 bg-purple-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Transactions
              </Link>
              <Link 
                to="/analytics"
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/analytics'
                    ? 'text-purple-700 bg-purple-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Analytics
              </Link>
              <Link 
                to="/investment-planning"
                className={`block px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  location.pathname === '/investment-planning'
                    ? 'text-purple-700 bg-purple-100'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Investment planning
              </Link>
            </nav>
            <div className="p-4 border-t border-gray-200">
              <button onClick={handleSignOut} className="w-full text-left px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg">
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
