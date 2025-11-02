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
      <h2>🧠 AI Health Assistant</h2>
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
          <p>{result.predictions?.[0]?.[0] || "Unknown"}</p>

          <h4>Extracted Symptoms:</h4>
          <p>{result.extracted?.symptoms?.join(", ")}</p>

          <h4>Risk Score:</h4>
          <p>{result.risk_score.toFixed(2)}</p>

          {result.risk_score >= 0.7 && (
            <div style={styles.alertBox}>
              🚨 <b>High Risk Detected!</b> Please seek immediate medical attention
              or visit the nearest hospital.
            </div>
          )}

          {/* ✅ Download Prescription Button */}
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
    padding: "2rem",
    textAlign: "center",
    fontFamily: "Arial, sans-serif",
  },
  form: {
    marginTop: "1rem",
  },
  textarea: {
    width: "80%",
    height: "100px",
    padding: "10px",
    fontSize: "16px",
    borderRadius: "8px",
    border: "1px solid #ccc",
  },
  button: {
    marginTop: "1rem",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#007bff",
    color: "white",
    cursor: "pointer",
  },
  downloadBtn: {
    marginTop: "1rem",
    padding: "10px 20px",
    fontSize: "16px",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#28a745",
    color: "white",
    cursor: "pointer",
  },
  resultBox: {
    marginTop: "2rem",
    padding: "1rem",
    backgroundColor: "#f9f9f9",
    borderRadius: "8px",
    textAlign: "left",
    width: "80%",
    margin: "auto",
  },
  alertBox: {
    marginTop: "1rem",
    padding: "1rem",
    backgroundColor: "#ffcccc",
    color: "#b30000",
    border: "2px solid #b30000",
    borderRadius: "8px",
    fontWeight: "bold",
    textAlign: "center",
  },
};
