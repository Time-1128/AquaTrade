const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const fishRoutes = require("./routes/fishRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");

const errorMiddleware = require("./middlewares/errorMiddleware");

const app = express();
const server = http.createServer(app);

/* ===============================
   ENSURE UPLOADS FOLDER EXISTS
================================ */

const uploadsPath = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsPath)) {
  fs.mkdirSync(uploadsPath, { recursive: true });
  console.log("Uploads folder created");
}

/* ===============================
   SOCKET.IO
================================ */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

io.on("connection", (socket) => {

  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });

});

/* ===============================
   MIDDLEWARE
================================ */

app.use(cors());

app.use(express.json({
  limit: "10mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "10mb"
}));

/* ===============================
   STATIC IMAGE SERVE
================================ */

app.use("/uploads", express.static(uploadsPath));

/* ===============================
   ROOT ROUTE
================================ */

app.get("/", (req, res) => {
  res.send("AquaFresh Backend Running 🚀");
});

/* ===============================
   API ROUTES
================================ */

app.use("/api/fish", fishRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);

/* ===============================
   ERROR HANDLER
================================ */

app.use(errorMiddleware);

/* ===============================
   SERVER START
================================ */

const PORT = 5000;

server.listen(PORT, () => {
  console.log(`🚀 AquaFresh server running on port ${PORT}`);
});