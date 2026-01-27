import { useState } from "react";
import api from "../api/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const login = async () => {
    try {
      const res = await api.post("/api/auth/signin", {
        username,
        password,
      });

      localStorage.setItem("token", res.data.token);
      navigate("/rooms");
    } catch {
      alert("Invalid username or password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-80 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold text-center mb-4">Login</h2>

        <input
          className="w-full border p-2 mb-3 rounded"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="w-full border p-2 mb-4 rounded"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          className="w-full bg-black text-white py-2 rounded"
        >
          Login
        </button>

        <Link
          to="/register"
          className="block text-center text-sm text-gray-600 mt-4"
        >
          Create an account
        </Link>
      </div>
    </div>
  );
}
