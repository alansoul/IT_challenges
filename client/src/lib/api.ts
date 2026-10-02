import axios from 'axios';

const api = axios.create({
  // Setting baseURL to an empty string routes all calls (e.g., /api/challenges) 
  // directly through your Next.js reverse-proxy rewrite. 
  // This turns the session cookie into a 100% First-Party Cookie!
  baseURL: '',
  withCredentials: true,
});

export default api;