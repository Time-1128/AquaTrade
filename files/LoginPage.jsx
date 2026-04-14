import { useState } from "react";
import { useApp } from "../context/AppContext";

export default function LoginPage() {
  const { dispatch } = useApp();
  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  const sendOTP = () => {
    if (phone.length !== 10) { setError("Enter a valid 10-digit number"); return; }
    setError("");
    setLoading(true);
    // Get location
    navigator.geolocation?.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => setLocation({ lat: 13.0827, lng: 80.2707 }) // fallback to Chennai
    );
    setTimeout(() => { setLoading(false); setStep("otp"); }, 1500);
  };

  const verifyOTP = () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      dispatch({ type: "SET_USER", payload: { phone, location: location || { lat: 13.0827, lng: 80.2707 } } });
      dispatch({ type: "SET_PAGE", payload: "roleSelect" });
    }, 1500);
  };

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[i] = val;
    setOtp(next);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8F0", display: "flex", flexDirection: "column" }}>
      {/* Top ocean header */}
      <div style={{
        background: "linear-gradient(160deg, #0A3D62 0%, #00B4D8 100%)",
        padding: "50px 24px 70px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden"
      }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌊</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
          Welcome Back
        </h1>
        <p style={{ color: "rgba(255,255,255,0.7)", fontFamily: "'DM Sans', sans-serif", fontSize: "14px" }}>
          Your freshest catch awaits
        </p>
        <div style={{
          position: "absolute", bottom: 0, left: "50%",
          width: "200%", height: "50px", background: "#FFF8F0",
          borderRadius: "50% 50% 0 0", transform: "translateX(-50%)"
        }} />
      </div>

      {/* Form card */}
      <div style={{ padding: "0 24px", marginTop: "-10px", flex: 1 }}>
        <div className="card" style={{ padding: "28px 24px", marginBottom: "20px" }}>
          {step === "phone" ? (
            <>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, marginBottom: "6px", color: "#0A3D62" }}>
                Enter your number
              </h2>
              <p style={{ color: "#718096", fontSize: "14px", marginBottom: "24px", fontFamily: "'DM Sans', sans-serif" }}>
                We'll send you a one-time password
              </p>

              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div style={{
                  position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)",
                  fontFamily: "'Syne', sans-serif", fontWeight: 700, color: "#0A3D62", fontSize: "15px"
                }}>+91</div>
                <input
                  type="tel" maxLength={10} value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="input-field"
                  style={{ paddingLeft: "52px", fontSize: "18px", letterSpacing: "2px" }}
                />
              </div>

              {error && <p style={{ color: "#E74C3C", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

              <button className="btn-primary" onClick={sendOTP} disabled={loading}>
                {loading ? (
                  <div className="loader">
                    <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
                  </div>
                ) : "Send OTP →"}
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep("phone")} style={{
                background: "none", border: "none", color: "#00B4D8", fontSize: "20px",
                cursor: "pointer", marginBottom: "12px"
              }}>←</button>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, marginBottom: "6px", color: "#0A3D62" }}>
                Verify OTP
              </h2>
              <p style={{ color: "#718096", fontSize: "14px", marginBottom: "8px" }}>
                Sent to +91 {phone}
              </p>
              <p style={{
                background: "#E8F9FF", border: "1px solid #B3ECF7", borderRadius: "8px",
                padding: "8px 14px", fontSize: "13px", color: "#0A3D62", marginBottom: "24px",
                fontFamily: "'Syne', sans-serif", fontWeight: 600
              }}>
                🔐 Demo OTP: Use any 6 digits
              </p>

              <div style={{ display: "flex", gap: "12px", marginBottom: "20px", justifyContent: "center" }}>
                {otp.map((digit, i) => (
                  <input
                    key={i} id={`otp-${i}`} type="tel" maxLength={1} value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    style={{
                      width: "56px", height: "60px", textAlign: "center",
                      fontSize: "24px", fontFamily: "'Syne', sans-serif", fontWeight: 800,
                      border: digit ? "2px solid #00B4D8" : "2px solid rgba(0,180,216,0.2)",
                      borderRadius: "12px", background: digit ? "#E8F9FF" : "white",
                      color: "#0A3D62", outline: "none", transition: "all 0.2s"
                    }}
                  />
                ))}
              </div>

              {error && <p style={{ color: "#E74C3C", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}

              <button className="btn-primary" onClick={verifyOTP} disabled={loading}>
                {loading ? (
                  <div className="loader">
                    <div className="loader-dot" /><div className="loader-dot" /><div className="loader-dot" />
                  </div>
                ) : "Verify & Continue →"}
              </button>

              <p style={{ textAlign: "center", marginTop: "16px", fontSize: "13px", color: "#718096" }}>
                Didn't receive? <span style={{ color: "#00B4D8", cursor: "pointer", fontWeight: 600 }}>Resend OTP</span>
              </p>
            </>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "12px", color: "#A0AEC0", lineHeight: 1.5 }}>
          By continuing, you agree to AquaFresh's <span style={{ color: "#00B4D8" }}>Terms of Service</span> & <span style={{ color: "#00B4D8" }}>Privacy Policy</span>
        </p>
      </div>
    </div>
  );
}
