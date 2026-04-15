import { useRef, useState } from "react";
import { useApp } from "./context/AppContext";
import { auth, db } from "./firebase.config";
import {
  RecaptchaVerifier,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

export default function LoginPage() {
  const { dispatch, loginInProgress } = useApp();

  const [mode, setMode] = useState("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [phoneStep, setPhoneStep] = useState("phone");
  const [confirmationResult, setConfirmationResult] = useState(null);
  const otpRefs = useRef([]);

  const isProfileComplete = (data) => {
    const hasName = !!data?.name?.trim();
    const hasContact = !!data?.email?.trim() || !!data?.phoneNumber?.trim();
    const hasRole = !!data?.role;
    const hasAddress = !!data?.address?.trim();
    if (!hasName || !hasContact || !hasRole || !hasAddress) return false;
    if (data.role === "seller") {
      return !!data?.shopName?.trim() && !!data?.description?.trim() && !!data?.availableTiming?.trim();
    }
    return true;
  };

  const routeAfterAuth = async (firebaseUser, fallbackContact = {}) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : {};

    dispatch({
      type: "SET_USER",
      payload: {
        uid: firebaseUser.uid,
        email: firebaseUser.email || fallbackContact.email || "",
        phoneNumber: firebaseUser.phoneNumber || fallbackContact.phoneNumber || "",
        ...userData,
      },
    });

    if (!userDoc.exists() || !isProfileComplete(userData)) {
      dispatch({ type: "SET_PAGE", payload: "profileSetup" });
      return;
    }
    dispatch({
      type: "SET_PAGE",
      payload: userData.role === "seller" ? "seller" : "home",
    });
  };

  const handleEmailLogin = async () => {
    if (!email.trim()) return setError("Email is required.");
    if (!password) return setError("Password is required.");

    setError("");
    setLoading(true);
    loginInProgress.current = true;
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
      await routeAfterAuth(cred.user, { email: email.trim() });
    } catch (err) {
      const msg = {
        "auth/invalid-email": "Enter a valid email address.",
        "auth/user-disabled": "This account has been disabled.",
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/invalid-credential": "Incorrect email or password.",
        "auth/too-many-requests": "Too many attempts. Try again later.",
        "auth/operation-not-allowed":
          "Email/Password sign-in is not enabled in Firebase Authentication. Enable it in Firebase Console > Authentication > Sign-in method.",
      };
      setError(msg[err.code] || "Login failed. Please try again.");
    } finally {
      loginInProgress.current = false;
      setLoading(false);
    }
  };

  const initRecaptcha = async () => {
    if (window.recaptchaVerifier) {
      try {
        window.recaptchaVerifier.clear();
      } catch {}
      window.recaptchaVerifier = null;
    }

    const container = document.getElementById("recaptcha-container");
    if (container) container.innerHTML = "";

    const verifier = new RecaptchaVerifier(auth, "recaptcha-container", {
      size: "invisible",
    });
    window.recaptchaVerifier = verifier;
    await verifier.render();
    return verifier;
  };

  const handleSendOtp = async () => {
    if (!/^\d{10}$/.test(phone)) {
      setError("Enter a valid 10-digit phone number.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const verifier = await initRecaptcha();
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      setConfirmationResult(result);
      setPhoneStep("otp");
    } catch (err) {
      const msg = {
        "auth/invalid-phone-number": "Invalid phone number format.",
        "auth/too-many-requests": "Too many OTP requests. Try again later.",
        "auth/operation-not-allowed": "Phone login is not enabled in Firebase.",
      };
      setError(msg[err.code] || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const code = otp.join("");
    if (code.length !== 6) return setError("Enter the 6-digit OTP.");
    if (!confirmationResult) return setError("OTP session expired. Please resend.");

    setError("");
    setLoading(true);
    loginInProgress.current = true;
    try {
      const cred = await confirmationResult.confirm(code);
      await routeAfterAuth(cred.user, { phoneNumber: `+91${phone}` });
    } catch (err) {
      const msg = {
        "auth/invalid-verification-code": "Invalid OTP. Please try again.",
        "auth/code-expired": "OTP expired. Please request a new one.",
      };
      setError(msg[err.code] || "OTP verification failed.");
    } finally {
      loginInProgress.current = false;
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F5F7FA", display: "flex", flexDirection: "column" }}>
      <div id="recaptcha-container"></div>
      <div
        style={{
          background: "linear-gradient(160deg, #0F4C75 0%, #00B4D8 100%)",
          padding: "52px 24px 72px",
          textAlign: "center",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div style={{ fontSize: "48px", marginBottom: "10px" }}>🐟</div>
        <h1 style={{ fontSize: "28px", fontWeight: 800, color: "white", marginBottom: "6px" }}>Welcome to AquaTrade</h1>
        <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "14px" }}>Login with Email or Phone OTP</p>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            width: "200%",
            height: "50px",
            background: "#F5F7FA",
            borderRadius: "50% 50% 0 0",
            transform: "translateX(-50%)",
          }}
        />
      </div>

      <div style={{ padding: "0 22px 40px", marginTop: "-8px", flex: 1 }}>
        <div style={{ background: "white", borderRadius: "18px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.06)" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
            <button
              type="button"
              onClick={() => {
                setMode("email");
                setError("");
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "10px",
                padding: "10px",
                cursor: "pointer",
                fontWeight: 700,
                background: mode === "email" ? "#0F4C75" : "#EEF2F7",
                color: mode === "email" ? "white" : "#4B5563",
              }}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => {
                setMode("phone");
                setError("");
              }}
              style={{
                flex: 1,
                border: "none",
                borderRadius: "10px",
                padding: "10px",
                cursor: "pointer",
                fontWeight: 700,
                background: mode === "phone" ? "#0F4C75" : "#EEF2F7",
                color: mode === "phone" ? "white" : "#4B5563",
              }}
            >
              Phone Login
            </button>
          </div>

          {mode === "email" ? (
            <>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#0F4C75", fontSize: "13px" }}>Email</label>
              <input
                className="input-field"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />

              <label style={{ display: "block", marginBottom: "6px", marginTop: "12px", fontWeight: 700, color: "#0F4C75", fontSize: "13px" }}>Password</label>
              <input
                className="input-field"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button className="btn-primary" onClick={handleEmailLogin} disabled={loading} style={{ marginTop: "16px" }}>
                {loading ? "Signing in..." : "Continue with Email"}
              </button>
            </>
          ) : (
            <>
              {phoneStep === "phone" ? (
                <>
                  <label style={{ display: "block", marginBottom: "6px", fontWeight: 700, color: "#0F4C75", fontSize: "13px" }}>Phone Number</label>
                  <input
                    className="input-field"
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                  />
                  <button className="btn-primary" onClick={handleSendOtp} disabled={loading} style={{ marginTop: "16px" }}>
                    {loading ? "Sending OTP..." : "Send OTP"}
                  </button>
                </>
              ) : (
                <>
                  <p style={{ color: "#6B7280", marginBottom: "12px", fontSize: "14px" }}>Enter OTP sent to +91 {phone}</p>
                  <div style={{ display: "flex", gap: "8px", marginBottom: "14px", justifyContent: "center" }}>
                    {otp.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => (otpRefs.current[index] = el)}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const next = [...otp];
                          next[index] = value;
                          setOtp(next);
                          if (value && index < 5) otpRefs.current[index + 1]?.focus();
                        }}
                        style={{
                          width: "42px",
                          height: "48px",
                          textAlign: "center",
                          fontSize: "18px",
                          borderRadius: "10px",
                          border: "2px solid #C7D2FE",
                          outline: "none",
                        }}
                      />
                    ))}
                  </div>
                  <button className="btn-primary" onClick={handleVerifyOtp} disabled={loading}>
                    {loading ? "Verifying..." : "Verify OTP"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPhoneStep("phone");
                      setOtp(["", "", "", "", "", ""]);
                      setConfirmationResult(null);
                      setError("");
                    }}
                    style={{
                      marginTop: "10px",
                      background: "none",
                      border: "none",
                      color: "#0F4C75",
                      fontWeight: 700,
                      cursor: "pointer",
                    }}
                  >
                    Change phone / Resend
                  </button>
                </>
              )}
            </>
          )}

          {error && <p style={{ color: "#C0392B", fontSize: "13px", marginTop: "10px" }}>{error}</p>}

          <p style={{ textAlign: "center", marginTop: "14px", color: "#6B7280", fontSize: "14px" }}>
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => dispatch({ type: "SET_PAGE", payload: "profileSetup" })}
              style={{ background: "none", border: "none", color: "#0F4C75", fontWeight: 700, cursor: "pointer" }}
            >
              Sign Up
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
