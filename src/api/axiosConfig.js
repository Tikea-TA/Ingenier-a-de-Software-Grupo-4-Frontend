import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://98.85.241.48:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
