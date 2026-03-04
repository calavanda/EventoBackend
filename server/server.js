const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const apiRoutes = require("./routes/api");
const Admin = require("./models/Admin");
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
// Railway proporciona una variable de entorno PORT, debemos usarla si está presente
const PORT = process.env.PORT || process.env.BACKEND_PORT || 5001;

// Middleware - permitir todo para evitar CORS
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
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

// 404 (ayuda a diagnosticar rutas faltantes)
app.use((req, res) => {
  console.log(`404 - Ruta no encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ error: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

const mongoUri = process.env.MONGODB_URI;
console.log('PORT:', PORT);
console.log('MONGODB_URI exists:', !!mongoUri);

if (!mongoUri) {
  console.error("ERROR CRÍTICO: La variable de entorno MONGODB_URI no existe.");
  console.error("Asegúrate de configurar MONGODB_URI en la pestaña Variables de Railway.");
  // No existe, solo inicia el servidor sin DB para poder ver los logs
} else {
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log("Conectado a MongoDB");
      // Auto-seeder para asegurar administradores al inicio (útil para despliegue en Vercel)
      try {
        const defaultAdmins = [
          { nombre: 'Admin Principal', email: '22610282@utgz.edu.mx', rol: 'admin', activo: true },
          { nombre: 'Alfredo Admin', email: 'tu-correo@gmail.com', rol: 'admin', activo: true }
        ];
        for (const adminData of defaultAdmins) {
          await Admin.findOneAndUpdate(
            { email: adminData.email.toLowerCase() },
            adminData,
            { upsert: true }
          );
        }
        console.log("✅ Administradores base verificados/creados.");
      } catch (seedErr) {
        console.error("Error en auto-seeding:", seedErr.message);
      }
    })
    .catch((err) => {
      console.error("Detalles del error de conexión a MongoDB:", err.message);
    });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor corriendo en el puerto: ${PORT}`);
});