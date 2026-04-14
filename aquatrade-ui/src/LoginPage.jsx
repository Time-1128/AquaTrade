import { useRef, useState } from "react";
import { useApp } from "./context/AppContext";
import { auth, db } from "./firebase.config";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { doc, serverTimestamp, setDoc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const { state, dispatch, loginInProgress } = useApp(); // ← get the ref
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  const initRecaptchaVerifier = async () => {
    if (window.recaptchaVerifier) {
      try { window.recaptchaVerifier.clear(); } catch {}
      window.recaptchaVerifier = null;
    }
    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";

    try {
      const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => console.log("reCAPTCHA solved"),
        "expired-callback": () => console.warn("reCAPTCHA expired"),
      });
      window.recaptchaVerifier = verifier;
      await verifier.render();
      return verifier;
    } catch (err) {
      window.recaptchaVerifier = null;
      throw new Error(`reCAPTCHA initialization failed: ${err.message}`);
    }
  };

  const sendOTP = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const appVerifier = await initRecaptchaVerifier();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, appVerifier);
      setConfirmationResult(result);
      setStep("otp");
    } catch (err) {
      const msgs = {
        "auth/invalid-phone-number": "Invalid phone number format.",
        "auth/too-many-requests": "Too many OTP requests. Try again later.",
        "auth/operation-not-allowed": "Phone authentication is not enabled in Firebase.",
        "auth/app-not-authorized": "This app is not authorized for Firebase Phone Auth.",
        "auth/web-storage-unsupported": "Web storage is blocked or unsupported.",
      };
      setError(msgs[err.code] || err.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    const code = otp.join("");
    if (code.length !== 6) { setError("Enter the 6-digit OTP"); return; }
    if (!confirmationResult) { setError("OTP session expired. Please resend."); return; }

    setError("");
    setLoading(true);

    // ── Tell onAuthStateChanged to stand down — we're handling routing ──
    loginInProgress.current = true;

    try {
      const userCredential = await confirmationResult.confirm(code);
      const user = userCredential.user;
      const phoneNumber = user.phoneNumber || `+91${phone}`;

      // Write lastLogin
      const userDocRef = doc(db, "users", user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        phoneNumber,
        lastLogin: serverTimestamp()
      }, { merge: true });

      // Now fetch the UPDATED profile
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      dispatch({
        type: "SET_USER",
        payload: { uid: user.uid, phoneNumber, ...userData }
      });

      const isProfileComplete = (data) => {
        const hasName = !!data?.name?.trim();
        const hasRole = !!data?.role;
        const hasAddress = !!data?.address?.trim();

        if (!hasName || !hasRole || !hasAddress) return false;
        if (data.role === "seller") {
          return !!data?.shopName?.trim() && !!data?.description?.trim() && !!data?.availableTiming?.trim();
        }
        return true;
      };

      // ── Route based on logout-intent + profile completeness ──
      if (state.askProfileSetup) {
        dispatch({ type: "SET_ASK_PROFILE_SETUP", payload: false });
        dispatch({ type: "SET_PAGE", payload: "profileSetup" });
      } else if (isProfileComplete(userData)) {
        dispatch({
          type: "SET_PAGE",
          payload: userData.role === "seller" ? "seller" : "home"
        });
      } else {
        // New or incomplete user — profile details still needed
        dispatch({ type: "SET_PAGE", payload: "profileSetup" });
      }

    } catch (err) {
      const msgs = {
        "auth/invalid-verification-code": "Invalid OTP. Please try again.",
        "auth/code-expired": "OTP expired. Please request a new code.",
      };
      setError(msgs[err.code] || err.message || "OTP verification failed.");
    } finally {
      setLoading(false);
      // ── Release the lock so future auth events work normally ──
      loginInProgress.current = false;
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const next = [...otp];
    next[index] = value;
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleResend = () => {
    setOtp(["", "", "", "", "", ""]);
    setError("");
    setConfirmationResult(null);
    setStep("phone");
    try { window.recaptchaVerifier?.clear(); } catch {}
    window.recaptchaVerifier = null;
    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFF8F0", display: "flex", flexDirection: "column" }}>
      <div id="recaptcha-container"></div>

      <div style={{
        background: "linear-gradient(160deg, #0A3D62 0%, #00B4D8 100%)",
        padding: "50px 24px 70px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ fontSize: "48px", marginBottom: "12px" }}>🌊</div>
        <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "6px" }}>
          {step === "phone" ? "Sign in with OTP" : "Verify your phone"}
        </h1>
        <p style={{ color: "rgba(255,255,255,0.8)", fontFamily: "'DM Sans', sans-serif", fontSize: "14px" }}>
          {step === "phone"
            ? "Enter your phone number to receive a one-time code."
            : "Enter the 6-digit code we sent to your phone."}
        </p>
        <div style={{
          position: "absolute", bottom: 0, left: "50%",
          width: "200%", height: "50px",
          background: "#FFF8F0",
          borderRadius: "50% 50% 0 0",
          transform: "translateX(-50%)",
        }} />
      </div>

      <div style={{ padding: "0 24px", marginTop: "-10px", flex: 1, paddingBottom: "40px" }}>
        <div className="card" style={{ padding: "28px 24px" }}>

          {step === "phone" ? (
            <>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, marginBottom: "20px", color: "#0A3D62" }}>
                Enter your mobile number
              </h2>
              <div style={{ position: "relative", marginBottom: "24px" }}>
                <div style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", fontWeight: 700, color: "#0A3D62" }}>
                  +91
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                  placeholder="9876543210"
                  className="input-field"
                  style={{ paddingLeft: "52px", fontSize: "16px", width: "100%" }}
                />
              </div>
              {error && <p style={{ color: "#E74C3C", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <button className="btn-primary" onClick={sendOTP} disabled={loading}>
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => { setStep("phone"); setError(""); }}
                style={{ background: "none", border: "none", color: "#00B4D8", fontSize: "18px", cursor: "pointer", marginBottom: "16px" }}
              >
                ← Back
              </button>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: "20px", fontWeight: 700, marginBottom: "6px", color: "#0A3D62" }}>
                Enter OTP
              </h2>
              <p style={{ color: "#718096", marginBottom: "20px", fontSize: "14px" }}>
                Code sent to +91 {phone}
              </p>
              <div style={{ display: "flex", gap: "10px", marginBottom: "24px", justifyContent: "center" }}>
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpRefs.current[index] = el)}
                    type="tel"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    style={{
                      width: "45px", height: "55px",
                      textAlign: "center", fontSize: "20px",
                      borderRadius: "12px", border: "2px solid #00B4D8", outline: "none",
                    }}
                  />
                ))}
              </div>
              {error && <p style={{ color: "#E74C3C", fontSize: "13px", marginBottom: "12px" }}>{error}</p>}
              <button className="btn-primary" onClick={verifyOTP} disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <p style={{ marginTop: "20px", fontSize: "14px", textAlign: "center", color: "#4A5568" }}>
                Didn't receive the code?{" "}
                <button
                  type="button"
                  onClick={handleResend}
                  style={{ background: "none", border: "none", color: "#00B4D8", cursor: "pointer", fontWeight: 700 }}
                >
                  Resend
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}