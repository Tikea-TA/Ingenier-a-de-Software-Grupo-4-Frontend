import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "https://yaw0m5htqf.execute-api.us-east-1.amazonaws.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});
 

export default api;
