import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import jsPDF from "jspdf";

export default function HealthAssistant() {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);

  // Voice recognition states
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [permissionStatus, setPermissionStatus] = useState("");
  const recognitionRef = useRef(null);

  // Fetch user profile on component mount
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUserEmail("guest@example.com");
          setUserName("Guest User");
          return;
        }

        const response = await axios.get("http://127.0.0.1:8000/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        });

        setUserEmail(response.data.email);
        setUserName(response.data.username);
      } catch (error) {
        console.error("Failed to get user profile:", error);
        setUserEmail("user@example.com");
        setUserName("User");
      }
    };

    fetchUserProfile();
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    const checkSpeechSupport = () => {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        setSpeechSupported(true);
        setPermissionStatus("Speech recognition supported. Click to start.");
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        // Configure speech recognition for better results
        recognitionRef.current.continuous = true; // Changed back to true for better continuous listening
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        recognitionRef.current.maxAlternatives = 1;

        recognitionRef.current.onstart = () => {
          console.log('Speech recognition started successfully');
          setPermissionStatus("🎤 Listening... Speak now!");
          setIsListening(true);
        };

        recognitionRef.current.onresult = (event) => {
          console.log('Speech recognition result received', event);
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            console.log(`Result ${i}:`, transcript, 'Final:', event.results[i].isFinal);
            
            if (event.results[i].isFinal) {
              finalTranscript += transcript + ' ';
            } else {
              interimTranscript += transcript;
            }
          }

          // Update live transcript for interim results
          setCurrentTranscript(interimTranscript);
          
          // Add final transcript to main text immediately
          if (finalTranscript.trim()) {
            setText(prev => {
              const newText = prev + finalTranscript;
              console.log('Updated text:', newText);
              return newText;
            });
            setCurrentTranscript(''); // Clear interim after adding final
          }
        };

        recognitionRef.current.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          
          switch(event.error) {
            case 'not-allowed':
              setPermissionStatus("❌ Microphone access denied. Please allow microphone access in browser settings.");
              break;
            case 'no-speech':
              setPermissionStatus("⚠️ No speech detected. Click start and speak clearly.");
              break;
            case 'audio-capture':
              setPermissionStatus("❌ No microphone found. Please check your microphone.");
              break;
            case 'network':
              setPermissionStatus("❌ Network error. Please check your internet connection.");
              break;
            default:
              setPermissionStatus(`❌ Error: ${event.error}. Try again.`);
          }
        };

        recognitionRef.current.onend = () => {
          console.log('Speech recognition ended');
          setIsListening(false);
          setCurrentTranscript('');
          setPermissionStatus("✅ Speech recognition finished. Your text is ready to submit!");
        };

      } else {
        setSpeechSupported(false);
        setPermissionStatus("❌ Speech recognition not supported in this browser. Try Chrome or Edge.");
      }
    };

    checkSpeechSupport();
  }, []); // Fixed: removed isListening dependency to prevent infinite loop

  const startListening = async () => {
    if (!recognitionRef.current || !speechSupported) {
      setPermissionStatus("❌ Speech recognition not available");
      return;
    }

    try {
      // Clear any previous manual stop flag
      recognitionRef.current.manualStop = false;
      
      setPermissionStatus("🔄 Requesting microphone access...");
      
      // Request microphone permission explicitly
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 44100
        } 
      });
      
      // Stop the stream immediately as we just needed permission
      stream.getTracks().forEach(track => track.stop());
      
      setPermissionStatus("🔄 Starting speech recognition...");
      
      // Start recognition
      recognitionRef.current.start();
      
    } catch (error) {
      console.error('Microphone permission error:', error);
      setIsListening(false);
      
      if (error.name === 'NotAllowedError') {
        setPermissionStatus("❌ Microphone access denied. Please click the microphone icon in your browser's address bar and allow access.");
      } else if (error.name === 'NotFoundError') {
        setPermissionStatus("❌ No microphone found. Please connect a microphone and try again.");
      } else {
        setPermissionStatus(`❌ Error accessing microphone: ${error.message}`);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.manualStop = true;
      if (isListening) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setCurrentTranscript('');
      setPermissionStatus("✅ Speech recognition stopped manually. Your text is ready to submit!");
    }
  };

  const clearText = () => {
    setText("");
    setCurrentTranscript("");
    if (isListening) {
      stopListening();
    }
    setPermissionStatus("🗑️ Text cleared. Ready for new input.");
  };

  // Add a test function to verify text is being captured
  const testVoiceInput = () => {
    setText(prev => prev + " Test voice input is working! ");
    setPermissionStatus("✅ Test text added successfully!");
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const token = localStorage.getItem("token");

    // 1️⃣ Send symptoms to backend
    const res = await axios.post(
      "http://127.0.0.1:8000/symptoms/submit",
      { text },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    setResult(res.data);

    // 2️⃣ Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
  const lat = position.coords.latitude;
  const lon = position.coords.longitude;
  setUserLocation({ lat, lon });

  try {
    // ✅ Fetch nearby hospitals using Overpass API
    const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];
      (
        node["amenity"="hospital"](around:5000,${lat},${lon});
        way["amenity"="hospital"](around:5000,${lat},${lon});
        relation["amenity"="hospital"](around:5000,${lat},${lon});
      );
      out center;`;

    const res = await fetch(overpassUrl);
    const json = await res.json();

    const govKeywords = [
      "government",
      "civil",
      "general",
      "esi",
      "municipal",
      "public",
      "district",
    ];

    const hospitals = (json.elements || [])
      .map((el) => {
        const name = el.tags?.name || "Unnamed Hospital";
        const address = el.tags?.["addr:full"] || el.tags?.["addr:street"] || "Address not available";
        const isGov = govKeywords.some((w) =>
          name.toLowerCase().includes(w)
        );

        return {
          name,
          address,
          lat: el.lat || el.center?.lat,
          lon: el.lon || el.center?.lon,
          isGov,
        };
      })
      .filter((h) => h.lat && h.lon)
      .sort((a, b) => (a.isGov === b.isGov ? 0 : a.isGov ? -1 : 1))
      .slice(0, 10);

    setNearbyHospitals(hospitals);
  } catch (error) {
    console.error("Error fetching hospitals:", error);
  }
});

    } else {
      alert("Geolocation not supported in your browser.");
    }
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
    const fileName = `${userName || 'user'}_${date
      .toISOString()
      .slice(0, 16)
      .replace("T", "_")
      .replace(":", "-")}.pdf`;

    doc.setFont("helvetica", "bold");
    doc.text("🩺 AI Health Assistant Prescription", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.text(`Patient: ${userName || 'User'}`, 20, 35);
    doc.text(`Email: ${userEmail || 'user@example.com'}`, 20, 45);
    doc.text(`Date: ${date.toLocaleString()}`, 20, 55);

    doc.line(20, 65, 190, 65); // divider line

    doc.text("Predicted Disease:", 20, 80);
    doc.text(`${result.predictions?.[0]?.[0] || "Unknown"}`, 80, 80);

    doc.text("Extracted Symptoms:", 20, 95);
    doc.text(
      `${result.extracted?.symptoms?.join(", ") || "None"}`,
      80,
      95
    );

    doc.text("Risk Score:", 20, 110);
    doc.text(`${result.risk_score.toFixed(2)}`, 80, 110);

    if (result.risk_score >= 0.7) {
      doc.setTextColor(200, 0, 0);
      doc.text(
        "🚨 High Risk: Please seek immediate medical attention.",
        20,
        125
      );
      doc.setTextColor(0, 0, 0);
    }

    doc.text("Disease Description:", 20, 140);
    const description = result.details?.description || "No description available.";
    doc.text(description, 20, 150, { maxWidth: 170 });

    doc.text("Recommended Action / Notes:", 20, 170);
    doc.text(
      result.recommendations || "Consult a certified doctor for further advice.",
      20,
      180,
      { maxWidth: 170 }
    );

    doc.save(fileName);
  };

return (
  <div style={styles.container}>
    <div style={styles.titleSection}>
      <h1 style={styles.mainTitle}>🧠 AI Health Assistant</h1>
      {userName && (
        <p style={styles.welcomeText}>
          Welcome, {userName}! ({userEmail})
        </p>
      )}
      <h2 style={styles.sectionTitle}>Ask a Question</h2>
      <p style={styles.sectionText}>
        Describe your symptoms by typing or using voice input:
      </p>
    </div>

    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Voice Input Section */}
      <div style={styles.voiceSection}>
        <div style={styles.voiceControls}>
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            disabled={!speechSupported}
            style={{
              ...styles.voiceBtn,
              backgroundColor: !speechSupported
                ? "#6c757d"
                : isListening
                ? "#ff7675"
                : "#00b894",
              cursor: !speechSupported ? "not-allowed" : "pointer",
            }}
          >
            {!speechSupported
              ? "🎤 Not Supported"
              : isListening
              ? "🎤 Stop Recording"
              : "🎤 Start Voice Input"}
          </button>
          <button type="button" onClick={clearText} style={styles.clearBtn}>
            🗑️ Clear All
          </button>
          <button type="button" onClick={testVoiceInput} style={styles.testBtn}>
            🧪 Test
          </button>
        </div>

        <div style={styles.statusDisplay}>
          <div
            style={{
              fontSize: "14px",
              color: permissionStatus.includes("❌")
                ? "#dc3545"
                : permissionStatus.includes("🎤")
                ? "#28a745"
                : permissionStatus.includes("✅")
                ? "#007bff"
                : "#666",
              fontWeight: "500",
              padding: "8px",
              borderRadius: "6px",
              backgroundColor: permissionStatus.includes("❌")
                ? "#f8d7da"
                : permissionStatus.includes("🎤")
                ? "#d4edda"
                : permissionStatus.includes("✅")
                ? "#cce5ff"
                : "#f8f9fa",
            }}
          >
            {permissionStatus}
          </div>
        </div>

        {isListening && (
          <div style={styles.listeningIndicator}>
            <div style={styles.pulseAnimation}></div>
            <span>🎤 Recording... Speak clearly: "I have headache and fever"</span>
          </div>
        )}

        {currentTranscript && (
          <div style={styles.liveTranscript}>
            <strong>🔄 Live: </strong>
            {currentTranscript}
          </div>
        )}

        <div style={styles.debugInfo}>
          📝 Current text length: {text.length} characters
          {text && (
            <div style={{ marginTop: "5px", fontSize: "12px", color: "#666" }}>
              Preview: "{text.substring(0, 50)}..."
            </div>
          )}
        </div>

        {speechSupported && (
          <div style={styles.helpText}>
            💡 <strong>Tips:</strong> Speak clearly, e.g. “I have stomach pain”.
          </div>
        )}
      </div>

      <textarea
        style={styles.textarea}
        placeholder="Describe your symptoms..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        required
      />

      <button
        type="submit"
        disabled={loading || !text.trim()}
        style={{
          ...styles.button,
          backgroundColor: !text.trim() ? "#6c757d" : undefined,
          cursor: !text.trim() ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Analyzing..." : `Submit (${text.trim().length} chars)`}
      </button>
    </form>

    {/* Result section */}
    {result && (
      <div style={styles.resultBox}>
        <h3>🩺 Predicted Disease:</h3>
        <p style={styles.diseaseTitle}>
          {result.predictions?.[0]?.[0] || "Unknown"}
        </p>

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

    {/* ✅ NEW LOCATION + HOSPITAL SECTION */}
    {userLocation && (
      <div style={{ marginTop: "20px", padding: "10px", background: "#f1f9ff", borderRadius: "8px" }}>
        <h3>📍 Your Current Location</h3>
        <p>Latitude: {userLocation.lat.toFixed(5)}</p>
        <p>Longitude: {userLocation.lon.toFixed(5)}</p>
        <a
          href={`https://www.google.com/maps?q=${userLocation.lat},${userLocation.lon}`}
          target="_blank"
          rel="noreferrer"
        >
          🌍 View on Google Maps
        </a>
      </div>
    )}

    {nearbyHospitals.length > 0 && (
      <div style={{ marginTop: "15px" }}>
        <h3>🏥 Nearby Hospitals:</h3>
        {nearbyHospitals.map((h, idx) => (
          <div
            key={idx}
            style={{
              backgroundColor: h.isGov ? "#e8ffe8" : "#f8f9fa",
              border: h.isGov ? "1px solid #a4d4a4" : "1px solid #ddd",
              borderRadius: "8px",
              padding: "8px",
              marginTop: "8px",
            }}
          >
            <strong>{h.name}</strong>
            {h.isGov && " 🏛 (Government)"} <br />
            📍 {h.address}
            <br />
            <a href={`https://www.google.com/maps?q=${h.lat},${h.lon}`} target="_blank" rel="noreferrer">
              🗺 View on Map
            </a>
          </div>
        ))}
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
  welcomeText: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: "14px",
    margin: "0 0 20px 0",
    fontStyle: "italic"
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
  voiceSection: {
    marginBottom: "20px",
    padding: "15px",
    borderRadius: "12px",
    backgroundColor: "#f8f9fa",
    border: "2px dashed #667eea"
  },
  voiceControls: {
    display: "flex",
    gap: "10px",
    marginBottom: "10px",
    justifyContent: "center",
    flexWrap: "wrap"
  },
  statusDisplay: {
    textAlign: "center",
    marginBottom: "15px",
    minHeight: "40px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center"
  },
  voiceBtn: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)"
  },
  clearBtn: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6c757d",
    color: "white",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)"
  },
  testBtn: {
    padding: "12px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#ffc107",
    color: "#000",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)"
  },
  listeningIndicator: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    color: "#ff7675",
    fontWeight: "600",
    marginBottom: "10px",
    backgroundColor: "#fff3f3",
    padding: "8px",
    borderRadius: "8px"
  },
  pulseAnimation: {
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    backgroundColor: "#ff7675",
    animation: "pulse 1.5s infinite"
  },
  liveTranscript: {
    padding: "12px",
    backgroundColor: "#e3f2fd",
    borderRadius: "8px",
    fontSize: "16px",
    color: "#1976d2",
    border: "1px solid #bbdefb",
    fontStyle: "italic",
    minHeight: "20px",
    fontWeight: "500"
  },
  debugInfo: {
    fontSize: "12px",
    color: "#007bff",
    textAlign: "center",
    marginTop: "5px",
    padding: "5px",
    backgroundColor: "#e3f2fd",
    borderRadius: "4px",
    border: "1px solid #bbdefb"
  },
  helpText: {
    fontSize: "12px",
    color: "#666",
    textAlign: "center",
    marginTop: "10px",
    padding: "8px",
    backgroundColor: "#e9ecef",
    borderRadius: "6px",
    borderLeft: "3px solid #667eea"
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
  }
};

// Add CSS animation for pulse effect
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = `
  @keyframes pulse {
    0% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(255, 118, 117, 0.7);
    }
    70% {
      transform: scale(1);
      box-shadow: 0 0 0 10px rgba(255, 118, 117, 0);
    }
    100% {
      transform: scale(0.95);
      box-shadow: 0 0 0 0 rgba(255, 118, 117, 0);
    }
  }
`;
document.head.appendChild(styleSheet);
