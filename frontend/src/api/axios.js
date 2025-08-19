import axios from 'axios';

// Use localhost to match the frontend origin
const baseURL = 'http://localhost:8000/'; // Your Django backend URL

const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true, // This ensures cookies are sent with requests
  headers: {
    'Content-Type': 'application/json',
  },
});
axiosInstance.interceptors.request.use(
  (config) => {
    // Get the access token from local storage
    const accessToken = localStorage.getItem('accessToken');
    
    // If the token exists, add it to the Authorization header
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
export default axiosInstance;