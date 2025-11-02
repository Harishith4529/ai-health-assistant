import React, { useState } from "react";
import { loginUser } from "../api";

export default function LoginForm({ onAuth }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await loginUser(form);
      localStorage.setItem("token", res.access_token);
      setMessage("Login successful!");
      onAuth(true);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2>Login</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
      />
      <button type="submit">Login</button>
      <p>{message}</p>
    </form>
  );
}

const styles = {
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    width: "250px",
    margin: "20px auto",
    textAlign: "center"
  }
};
