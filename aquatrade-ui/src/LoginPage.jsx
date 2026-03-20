import { useState, useRef } from "react";
import { useApp } from "./context/AppContext";

export default function LoginPage() {
  const { dispatch } = useApp();

  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [location, setLocation] = useState(null);

  const otpRefs = useRef([]);

  const sendOTP = () => {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit number");
      return;
    }

    setError("");
    setLoading(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          setLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          }),
        () =>
          setLocation({
            lat: 13.0827,
            lng: 80.2707,
          })
      );
    }

    setTimeout(() => {
      setLoading(false);
      setStep("otp");
    }, 1500);
  };

  const verifyOTP = () => {
    const code = otp.join("");

    if (code.length !== 4) {
      setError("Enter the 4-digit OTP");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);

      dispatch({
        type: "SET_USER",
        payload: {
          phone,
          location: location || { lat: 13.0827, lng: 80.2707 },
        },
      });

      dispatch({
        type: "SET_PAGE",
        payload: "roleSelect",
      });
    }, 1500);
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) {
      otpRefs.current[index + 1]?.focus();
    }

    if (!value && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#FFF8F0",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top header */}
      <div
        style={{
          background:
            "linear-gradient(160deg, #0A3D62 0%, #00B4D8 100%)",
          padding: "50px 24px 70px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌊</div>

        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontSize: "28px",
            fontWeight: 800,
            color: "white",
            marginBottom: "6px",
          }}
        >
          Welcome Back
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,0.7)",
            fontFamily: "'DM Sans', sans-serif",
            fontSize: "14px",
          }}
        >
          Your freshest catch awaits
        </p>

        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: "200%",
            height: "50px",
            background: "#FFF8F0",
            borderRadius: "50% 50% 0 0",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      {/* Form */}
      <div style={{ padding: "0 24px", marginTop: "-10px", flex: 1 }}>
        <div className="card" style={{ padding: "28px 24px" }}>
          {step === "phone" ? (
            <>
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "6px",
                  color: "#0A3D62",
                }}
              >
                Enter your number
              </h2>

              <p
                style={{
                  color: "#718096",
                  fontSize: "14px",
                  marginBottom: "24px",
                }}
              >
                We'll send you a one-time password
              </p>

              <div style={{ position: "relative", marginBottom: "16px" }}>
                <div
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    fontWeight: 700,
                    color: "#0A3D62",
                  }}
                >
                  +91
                </div>

                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) =>
                    setPhone(e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="9876543210"
                  className="input-field"
                  style={{
                    paddingLeft: "52px",
                    fontSize: "18px",
                    letterSpacing: "2px",
                  }}
                />
              </div>

              {error && (
                <p
                  style={{
                    color: "#E74C3C",
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                className="btn-primary"
                onClick={sendOTP}
                disabled={loading}
              >
                {loading ? "Sending..." : "Send OTP →"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep("phone")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#00B4D8",
                  fontSize: "20px",
                  cursor: "pointer",
                  marginBottom: "12px",
                }}
              >
                ←
              </button>

              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontSize: "20px",
                  fontWeight: 700,
                  marginBottom: "6px",
                  color: "#0A3D62",
                }}
              >
                Verify OTP
              </h2>

              <p style={{ color: "#718096", marginBottom: "16px" }}>
                Sent to +91 {phone}
              </p>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginBottom: "20px",
                  justifyContent: "center",
                }}
              >
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (otpRefs.current[i] = el)}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) =>
                      handleOtpChange(i, e.target.value)
                    }
                    style={{
                      width: "56px",
                      height: "60px",
                      textAlign: "center",
                      fontSize: "24px",
                      borderRadius: "12px",
                      border: "2px solid #00B4D8",
                    }}
                  />
                ))}
              </div>

              {error && (
                <p
                  style={{
                    color: "#E74C3C",
                    fontSize: "13px",
                    marginBottom: "12px",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                className="btn-primary"
                onClick={verifyOTP}
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify & Continue →"}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}