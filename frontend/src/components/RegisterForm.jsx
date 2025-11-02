import React, { useState } from "react";
import { registerUser } from "../api";

export default function RegisterForm({ onAuth }) {
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const res = await registerUser(form);
      localStorage.setItem("token", res.access_token);
      setMessage("Registration successful!");
      onAuth(true);
    } catch (err) {
      setMessage(err.message);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <h2 style={styles.title}>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
        style={styles.input}
      />
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        required
        style={styles.input}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        required
        style={styles.input}
      />
      <button type="submit" style={styles.button}>Register</button>
      <p style={styles.message}>{message}</p>
    </form>
  );
}

const styles = {
  form: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    width: "350px",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)"
  },
  title: {
    textAlign: "center",
    margin: "0 0 20px 0",
    color: "#333",
    fontSize: "28px",
    fontWeight: "600",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent"
  },
  input: {
    padding: "15px",
    borderRadius: "12px",
    border: "2px solid #e1e5e9",
    fontSize: "16px",
    transition: "all 0.3s ease",
    backgroundColor: "#f8f9fa",
    outline: "none"
  },
  button: {
    padding: "15px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    color: "white",
    fontSize: "16px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)"
  },
  message: {
    textAlign: "center",
    margin: "10px 0 0 0",
    color: "#555",
    fontSize: "14px"
  }
};
