// src/api/auth.js
import axiosInstance from './axios';

export const signupUser = async (userData) => {
  try {
    const response = await axiosInstance.post('/api/users/signup/', {
      email: userData.email,
      username: userData.username,
      name: userData.fullName, // This maps fullName to name field
      password: userData.password,
    });

    return { success: true, message: response.data.message };
  } catch (error) {
    console.error('Signup error details:', error.response?.data);
    const errorMessage = error.response?.data?.message || error.response?.data?.detail || "Signup failed";
    return { success: false, error: errorMessage };
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await axiosInstance.post(`/api/users/login/`, {
      email,
      password,
    });

    const { access, refresh } = response.data;

    localStorage.setItem("accessToken", access);
    localStorage.setItem("refreshToken", refresh);

    axiosInstance.defaults.headers["Authorization"] = `Bearer ${access}`;

    return { success: true, access, refresh };
  } catch (error) {
    const detail = error.response?.data?.detail || "Login failed";
    return { success: false, error: detail };
  }
};

export const logoutUser = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  delete axiosInstance.defaults.headers["Authorization"];
};

export const refreshToken = async () => {
  const refresh = localStorage.getItem("refreshToken");
  if (!refresh) return { success: false, error: "No refresh token" };

  try {
    const response = await axiosInstance.post(`/api/users/token/refresh/`, { refresh });

    const { access } = response.data;

    localStorage.setItem("accessToken", access);
    axiosInstance.defaults.headers["Authorization"] = `Bearer ${access}`;

    return { success: true, access };
  } catch (error) {
    return { success: false, error: "Session expired. Please log in again." };
  }
};

export const sendOtpToEmail = async (email) => {
  try {
    const res = await axiosInstance.post(`/api/users/send-otp/`, { email }, { withCredentials: true });
    return { success: true, message: res.data.message };
  } catch (err) {
    const errorMessage = err.response?.data?.error || err.message || "Failed to send OTP";
    return { success: false, error: errorMessage };
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const res = await axiosInstance.post(
      `/api/users/verify-otp/`,
      { email, otp },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    const errorMessage = err.response?.data?.error || "Invalid OTP";
    throw new Error(errorMessage);
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    const res = await axiosInstance.post(
      `/api/users/reset-password/`,
      { email, new_password: newPassword },
      { withCredentials: true }
    );
    return res.data;
  } catch (err) {
    return { error: err.message };
  }
};
