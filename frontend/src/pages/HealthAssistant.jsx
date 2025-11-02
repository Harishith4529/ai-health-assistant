import React, { useState } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export default function HealthAssistant() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("user@example.com"); // replace with logged-in user email

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await axios.post("http://127.0.0.1:8000/symptoms/submit", {
        text,
      });
      setResult(res.data);
    } catch (err) {
      console.error(err);
      alert("Failed to analyze symptoms.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Generate and Download Prescription PDF
  const handleDownload = () => {
    if (!result) return;

    const doc = new jsPDF();
    const date = new Date();
    const fileName = `${userEmail}_${date
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(":", "-")}.pdf`;

    doc.setFont("helvetica", "bold");
    doc.text("🩺 AI Health Assistant Prescription", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.text(`Email: ${userEmail}`, 20, 35);
    doc.text(`Date: ${date.toLocaleString()}`, 20, 45);

    doc.line(20, 50, 190, 50); // divider line

    doc.text("Predicted Disease:", 20, 65);
    doc.text(`${result.predictions?.[0]?.[0] || "Unknown"}`, 80, 65);

    doc.text("Extracted Symptoms:", 20, 80);
    doc.text(
      `${result.extracted?.symptoms?.join(", ") || "None"}`,
      80,
      80
    );

    doc.text("Risk Score:", 20, 95);
    doc.text(`${result.risk_score.toFixed(2)}`, 80, 95);

    if (result.risk_score >= 0.7) {
      doc.setTextColor(200, 0, 0);
      doc.text(
        "🚨 High Risk: Please seek immediate medical attention.",
        20,
        110
      );
      doc.setTextColor(0, 0, 0);
    }

    doc.text("Recommended Action / Notes:", 20, 130);
    doc.text(
      result.recommendations || "Consult a certified doctor for further advice.",
      20,
      140,
      { maxWidth: 170 }
    );

    doc.save(fileName);
  };

  return (
    <div style={styles.container}>
      <div style={styles.titleSection}>
        <h1 style={styles.mainTitle}>🧠 AI Health Assistant</h1>
        <h2 style={styles.sectionTitle}>Ask a Question</h2>
        <p style={styles.sectionText}>
          Describe your symptoms to get instant insights and recommendations:
        </p>
      </div>

      <form onSubmit={handleSubmit} style={styles.form}>
        <textarea
          style={styles.textarea}
          placeholder="Describe your symptoms..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button type="submit" disabled={loading} style={styles.button}>
          {loading ? "Analyzing..." : "Submit"}
        </button>
      </form>

      {result && (
        <div style={styles.resultBox}>
          <h3>🩺 Predicted Disease:</h3>
          <p style={styles.diseaseTitle}>{result.predictions?.[0]?.[0] || "Unknown"}</p>

          <h4>Disease Description:</h4>
          <p style={styles.description}>
            {result.details?.description || "No description available."}
          </p>

          <h4>Extracted Symptoms:</h4>
          <p>{result.extracted?.symptoms?.join(", ")}</p>

          <h4>Risk Score:</h4>
          <p>{result.risk_score.toFixed(2)}</p>

          <h4>Precautions:</h4>
          <div style={styles.precautions}>
            {result.details?.precautions?.length > 0 ? (
              <ul>
                {result.details.precautions.map((precaution, index) => (
                  <li key={index}>{precaution}</li>
                ))}
              </ul>
            ) : (
              <p>No specific precautions available.</p>
            )}
          </div>

          {result.risk_score >= 0.7 && (
            <div style={styles.alertBox}>
              🚨 <b>High Risk Detected!</b> Please seek immediate medical attention
              or visit the nearest hospital.
            </div>
          )}

          <button onClick={handleDownload} style={styles.downloadBtn}>
            💊 Download Prescription
          </button>
        </div>
      )}
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    padding: "2rem",
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  titleSection: {
    textAlign: "center",
    marginBottom: "2rem",
  },
  mainTitle: {
    color: "white",
    fontSize: "36px",
    fontWeight: "700",
    margin: "0 0 20px 0",
    textShadow: "0 2px 10px rgba(0, 0, 0, 0.3)",
  },
  sectionTitle: {
    color: "white",
    fontSize: "28px",
    fontWeight: "600",
    margin: "0 0 10px 0",
  },
  sectionText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "16px",
    margin: "0",
  },
  form: {
    marginTop: "2rem",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    padding: "30px",
    maxWidth: "800px",
    margin: "2rem auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
  },
  textarea: {
    width: "100%",
    height: "120px",
    padding: "15px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "2px solid #e1e5e9",
    backgroundColor: "#f8f9fa",
    outline: "none",
    transition: "all 0.3s ease",
    fontFamily: "inherit",
    resize: "vertical",
    boxSizing: "border-box",
  },
  button: {
    marginTop: "1.5rem",
    padding: "15px 30px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #74b9ff 0%, #0984e3 100%)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(116, 185, 255, 0.4)",
    minWidth: "150px",
  },
  downloadBtn: {
    marginTop: "1.5rem",
    padding: "15px 30px",
    fontSize: "16px",
    borderRadius: "12px",
    border: "none",
    background: "linear-gradient(135deg, #00b894 0%, #00a085 100%)",
    color: "white",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 15px rgba(0, 184, 148, 0.4)",
    display: "block",
    margin: "1.5rem auto 0",
  },
  resultBox: {
    marginTop: "3rem",
    padding: "30px",
    background: "rgba(255, 255, 255, 0.95)",
    borderRadius: "20px",
    textAlign: "left",
    maxWidth: "800px",
    margin: "3rem auto",
    boxShadow: "0 20px 40px rgba(0, 0, 0, 0.1)",
    backdropFilter: "blur(10px)",
    border: "1px solid rgba(255, 255, 255, 0.3)",
  },
  alertBox: {
    marginTop: "1.5rem",
    padding: "20px",
    background: "linear-gradient(135deg, #ff7675 0%, #e17055 100%)",
    color: "white",
    border: "none",
    borderRadius: "12px",
    fontWeight: "bold",
    textAlign: "center",
    boxShadow: "0 4px 15px rgba(255, 118, 117, 0.4)",
  },
  diseaseTitle: {
    fontSize: "20px",
    fontWeight: "600",
    color: "#667eea",
    margin: "0 0 15px 0"
  },
  description: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#555",
    backgroundColor: "#f8f9fa",
    padding: "15px",
    borderRadius: "8px",
    margin: "0 0 20px 0"
  },
  precautions: {
    backgroundColor: "#e8f5e8",
    padding: "15px",
    borderRadius: "8px",
    margin: "0 0 20px 0"
  },
};
