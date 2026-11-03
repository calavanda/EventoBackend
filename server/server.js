const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");
const { securityMiddleware } = require("./utils/security");

// Solo carga el archivo .env si existe y no sobreescribe las variables de entorno (Railway establece sus propias)
const envPath = path.join(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath, override: false });
  console.log('Cargado el archivo .env (sin sobreescribir las variables de entorno existentes)');
} else {
  console.log('No se encontró el archivo .env, usando variables de entorno del host');
}

const app = express();
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5001;

// Restricción de orígenes cruzados (CORS) a dominios autorizados (MASVS-NETWORK / VULN-06)
const defaultAllowedOrigins = [
  'https://evento-francophonie.vercel.app',
  'http://localhost:3000'
];

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : defaultAllowedOrigins;

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Bloqueado por politica de seguridad de origen (CORS).'));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Blindaje de seguridad contra inyecciones NoSQL y SQL
app.use(securityMiddleware);

// Rutas
app.use("/api", apiRoutes);
console.log('Rutas API cargadas correctamente en /api');

// Health check para Railway
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "EventoBackend está corriendo", routes: ["/api/participants", "/api/stands", "/api/surveys", "/api/visits/scan", "/api/reports/stats", "/api/reports/stand-visits"] });
});

// 404 (ayuda a diagnosticar rutas faltantes o eliminadas como /api/debug/seed)
app.use((req, res) => {
  console.log(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
  console.error("ERROR CRÍTICO: La variable de entorno MONGODB_URI no existe.");
  console.error("Asegúrate de configurar MONGODB_URI en la pestaña Variables de Railway.");
  // No existe, solo inicia el servidor sin DB para poder ver los logs
} else {
  mongoose
    .connect(mongoUri)
    .then(async () => {
      const dbName = mongoose.connection.name;
      console.log(`✅ Conectado a MongoDB. Base de datos: ${dbName}`);
    })
    .catch((err) => {
      console.error("Detalles del error de conexión a MongoDB:", err.message);
    });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
});
