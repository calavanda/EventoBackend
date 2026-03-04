# Evento Backend (Francophonie) v4.0.0

Servidor backend robusrt de alto rendimiento desarrollado en **Node.js** con **Express** y **MongoDB Atlas**, diseñado para la gestión integral de eventos con un enfoque primordial en la **seguridad**.

## 🚀 Características Principales

- **Blindaje de Seguridad Corporativo**: Protección activa contra inyecciones SQL y NoSQL mediante middleware de inspección de paquetes.
- **Sistema de Alertas de Seguridad**: Registro automático de intentos de ataque, capturando IP, patrón detectado y datos del atacante.
- **Gestión de Participantes**: Registro y administración de asistentes con generación de códigos QR únicos.
- **Control de Estands**: Administración de los espacios físicos del evento.
- **Registro de Visitas**: Escaneo de QR para registrar la interacción entre participantes y estands.
- **Sistema de Encuestas**: Recopilación de feedback de los asistentes por cada estand visitado.
- **Panel de Estadísticas**: Reportes agregados sobre afluencia, satisfacción y analíticas por estand.
- **Auto-Seeding Inteligente**: Inicialización automática de administradores al arranque (ideal para despliegues Serverless).

## 🛠️ Stack Tecnológico

- **Runtime**: [Node.js](https://nodejs.org/) (v20.x)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) (Cloud DB)
- **Despliegue**: [Vercel](https://vercel.com/) (Serverless Functions)

## 📁 Estructura del Proyecto

```text
server/
├── models/         # Esquemas de Mongoose (Admin, Participant, Stand, Visit, SecurityAlert)
├── routes/         # Definición de endpoints de la API (api.js)
├── utils/          # Utilidades y Middlewares de seguridad
└── server.js       # Punto de entrada optimizado para Vercel
```

## ⚙️ Configuración y Despliegue

### Variables de Entorno (.env)

```env
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/evento
PORT=5001
```

### Comandos Útiles

- `npm start`: Inicia el servidor.
- `node seedAdmins.js`: Crea los administradores base (opcional, ahora es automático).

## 🛰️ API Endpoints (Novedades)

### Seguridad

- `GET /api/security/alerts`: Ver lista de intentos de ataque detectados.
- `DELETE /api/security/alerts/clear`: Limpiar el historial de alertas.
- `GET /api/debug/seed`: Forzar la creación de administradores base (Ruta de emergencia).

### Otros Módulos

- `/api/participants`: Gestión de asistentes.
- `/api/stands`: Administración de estands.
- `/api/visits/scan`: Registro de visitas vía QR.
- `/api/reports`: Analíticas y estadísticas.

## ☁️ Arquitectura de Despliegue (New)

Este proyecto ha sido migrado de Railway a una arquitectura de alta disponibilidad:

1. **Frontend**: Desplegado en Vercel.
2. **Backend**: Desplegado en Vercel (Serverless).
3. **Database**: MongoDB Atlas (Tier Gratuito Dedicado).

---

© 2026 Evento - Sistema Seguro de Gestión de Participantes.
