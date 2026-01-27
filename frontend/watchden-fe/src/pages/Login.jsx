import { useState } from "react";
import { login } from "../api/auth.api";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Username and password required");
      return;
    }

    try {
      setLoading(true);

      const res = await login({
        username,
        password,
      });

      const token = res.data.token;

      if (!token) {
        alert("Login failed: no token received");
        return;
      }

      localStorage.setItem("token", token);

      // Redirect to a test room
      window.location.href = "/rooms/room123";
    } catch (err) {
      console.error(err);
      alert("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
};

export default Login;
