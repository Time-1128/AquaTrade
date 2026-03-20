export const sendOTP = (req, res) => {
  const { phone } = req.body;

  if (!phone) {
    return res.status(400).json({ message: "Phone number required" });
  }

  res.json({
    message: "OTP sent successfully",
    otp: "1234" // mock OTP
  });
};

export const verifyOTP = (req, res) => {
  const { otp } = req.body;

  if (otp === "1234") {
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid OTP" });
  }
};