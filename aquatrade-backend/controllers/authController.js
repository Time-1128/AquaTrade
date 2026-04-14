const db = require("../config/database");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = "aquatrade_secret_key"; // In production, move this to .env

exports.signup = async (req, res) => {
  const { username, password, phone, role } = req.body;

  if (!username || !password || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user already exists
    db.query(
      "SELECT id FROM users WHERE username = ? OR phone = ?",
      [username, phone],
      async (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        if (results.length > 0) {
          return res.status(400).json({ message: "Username or Phone already exists" });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert new user
        const insertQuery = "INSERT INTO users (username, password, phone, role) VALUES (?, ?, ?, ?)";
        const userRole = role || 'customer';
        
        db.query(insertQuery, [username, hashedPassword, phone, userRole], (err, result) => {
          if (err) return res.status(500).json({ error: err.message });

          const token = jwt.sign({ id: result.insertId, username, role: userRole }, JWT_SECRET, {
            expiresIn: "1d",
          });

          res.status(201).json({
            message: "User registered successfully",
            token,
            user: { id: result.insertId, username, phone, role: userRole }
          });
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: "Server error during registration" });
  }
};

exports.login = (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ message: "Username and password required" });
  }

  db.query(
    "SELECT * FROM users WHERE username = ?",
    [username],
    async (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      
      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = results[0];
      const match = await bcrypt.compare(password, user.password);

      if (!match) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, {
        expiresIn: "1d",
      });

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, username: user.username, phone: user.phone, role: user.role }
      });
    }
  );
};