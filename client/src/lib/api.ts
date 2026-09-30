import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000',
  // Crucial: This tells the browser to automatically attach the HttpOnly cookie to every request
  withCredentials: true, 
});

export default api;