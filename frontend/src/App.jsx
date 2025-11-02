import React, { useState, useEffect } from "react";
import RegisterForm from "./components/RegisterForm";
import LoginForm from "./components/LoginForm";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HealthAssistant from "./pages/HealthAssistant";

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [showLogin, setShowLogin] = useState(true);
  const [showWelcomePopup, setShowWelcomePopup] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      setShowWelcomePopup(true);
      // Auto-hide popup after 3 seconds
      const timer = setTimeout(() => {
        setShowWelcomePopup(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  function handleLogout() {
    localStorage.removeItem("token");
    setIsAuthenticated(false);
  }

  if (isAuthenticated) {
    return (
      <div style={styles.authenticatedContainer}>
        {/* Welcome Popup */}
        {showWelcomePopup && (
          <div style={styles.popup}>
            <div style={styles.popupContent}>
              <p>✅ You are logged in.</p>
              <p><strong>Welcome to AI Health Assistant</strong></p>
              <button 
                onClick={() => setShowWelcomePopup(false)} 
                style={styles.closeBtn}
              >
                ×
              </button>
            </div>
          </div>
        )}

        <div style={styles.header}>
          <button onClick={handleLogout} style={styles.logoutBtn}>
            Logout
          </button>
        </div>

        <HealthAssistant />
      </div>
    );
  }

  return (
    <div style={styles.authContainer}>
      <div style={styles.authContent}>
        {showLogin ? (
          <LoginForm onAuth={setIsAuthenticated} />
        ) : (
          <RegisterForm onAuth={setIsAuthenticated} />
        )}
        <button onClick={() => setShowLogin(!showLogin)} style={styles.toggleBtn}>
          {showLogin ? "Need an account? Register" : "Already have an account? Login"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  authContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  authContent: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "20px"
  },
  toggleBtn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "rgba(255, 255, 255, 0.9)",
    color: "#667eea",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0, 0, 0, 0.1)"
  },
  authenticatedContainer: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
  },
  header: {
    textAlign: "right",
    padding: "20px",
    margin: "20px"
  },
  logoutBtn: {
    padding: "12px 24px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #ff7675 0%, #e17055 100%)",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(255, 118, 117, 0.4)"
  },
  popup: {
    position: "fixed",
    top: "20px",
    right: "20px",
    zIndex: 1000,
    animation: "slideIn 0.3s ease-out"
  },
  popupContent: {
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "15px",
    padding: "20px 25px",
    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.2)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
    position: "relative",
    minWidth: "280px"
  },
  closeBtn: {
    position: "absolute",
    top: "10px",
    right: "15px",
    background: "none",
    border: "none",
    fontSize: "20px",
    cursor: "pointer",
    color: "#999",
    padding: "0",
    width: "20px",
    height: "20px"
  },
  sectionDivider: {
    height: "1px",
    background: "rgba(255, 255, 255, 0.3)",
    margin: "20px auto",
    width: "80%"
  },
  assistantSection: {
    textAlign: "center",
    padding: "20px",
    margin: "0 20px"
  },
  sectionTitle: {
    color: "white",
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 10px 0"
  },
  sectionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "16px",
    margin: "0"
  }
};
