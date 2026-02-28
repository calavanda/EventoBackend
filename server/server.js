const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");

// Only load .env file if it exists AND don't override existing env vars (Railway sets its own)
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('Loaded .env file (without overriding existing variables)');
} else {
  console.log('No .env file found, using environment variables from host');
}

const app = express();
// Railway provides a PORT environment variable, we must use it if present
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5001;

// Middleware - allow all to avoid CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json());

// Routes
app.use("/api", apiRoutes);

// Health check for Railway
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EventoBackend is running" });
});

const mongoUri = process.env.MONGODB_URI;
console.log('PORT:', PORT);
console.log('MONGODB_URI exists:', !!mongoUri);

if (!mongoUri) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing.");
  console.error("Make sure you set MONGODB_URI in Railway's Variables tab.");
  // Don't exit, just start the server without DB so we can see logs
} else {
  mongoose
    .connect(mongoUri)
    .then(() => console.log("Connected to MongoDB"))
    .catch((err) => {
      console.error("MongoDB connection error details:", err.message);
    });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});
