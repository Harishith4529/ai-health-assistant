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
      <h2>Register</h2>
      <input
        type="text"
        placeholder="Username"
        value={form.username}
        onChange={(e) => setForm({ ...form, username: e.target.value })}
        required
      />
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
      <button type="submit">Register</button>
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
