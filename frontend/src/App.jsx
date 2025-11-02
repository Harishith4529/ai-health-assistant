import React, { useState } from "react";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HealthAssistant from "./pages/HealthAssistant";




export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [showLogin, setShowLogin] = useState(true);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }

if (isAuthenticated) {
  return (
    <div style={styles.container}>
      <h1>Welcome to AI Health Assistant</h1>
      <p>✅ You are logged in.</p>
      <button onClick={handleLogout} style={styles.logoutBtn}>
        Logout
      </button>

      {/* Health Assistant section */}
      <div style={styles.sectionDivider} />

      <h2>Ask a Question</h2>
      <p>Describe your symptoms to get instant insights and recommendations:</p>

      {/* Embed the AI Assistant form */}
      <HealthAssistant />
    </div>
  );
}


  return (
    <div style={styles.container}>
      {showLogin ? (
        <LoginForm onAuth={setIsAuthenticated} />
      ) : (
        <RegisterForm onAuth={setIsAuthenticated} />
      )}
      <button onClick={() => setShowLogin(!showLogin)}>
        {showLogin ? "Need an account? Register" : "Already have an account? Login"}
      </button>
    </div>
  );
}

const styles = {
  container: {
    textAlign: "center",
    marginTop: "50px",
    fontFamily: "Arial"
  }
};
