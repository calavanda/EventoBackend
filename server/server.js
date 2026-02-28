const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");

try {
  dotenv.config({ path: path.join(__dirname, "..", ".env") });
} catch (error) {
  console.log(
    "No .env file found or accessible, relying on environment variables",
  );
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

const mongoUri = process.env.MONGODB_URI;
if (!mongoUri) {
  console.error("CRITICAL ERROR: MONGODB_URI environment variable is missing.");
  process.exit(1);
}

mongoose
  .connect(mongoUri)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => {
    console.error("MongoDB connection error details:", err.message);
  });

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
