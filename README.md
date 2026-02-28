# Evento Backend (Francophonie)

Servidor backend robusto desarrollado en **Node.js** con **Express** y **MongoDB**, diseñado para la gestión integral de eventos. Este sistema permite el registro de participantes, administración de estands, seguimiento de visitas mediante códigos QR y generación de estadísticas en tiempo real.

## 🚀 Características Principales

- **Gestión de Participantes**: Registro y administración de asistentes con generación de códigos QR únicos.
- **Control de Estands**: Administración de los espacios físicos del evento.
- **Registro de Visitas**: Escaneo de QR para registrar la interacción entre participantes y estands.
- **Sistema de Encuestas**: Recopilación de feedback de los asistentes por cada estand visitado.
- **Panel de Estadísticas**: Reportes agregados sobre afluencia, satisfacción y analíticas por estand.

## 🛠️ Stack Tecnológico

- **Runtime**: [Node.js](https://nodejs.org/) (v20.x recomendado)
- **Framework**: [Express.js](https://expressjs.com/)
- **Base de Datos**: [MongoDB](https://www.mongodb.com/) con [Mongoose](https://mongoosejs.com/)
- **Utilidades**:
  - `cors` para manejo de peticiones entre dominios.
  - `dotenv` para gestión de variables de entorno.
  - `moment` para manejo de fechas.

## 📁 Estructura del Proyecto

```text
server/
├── models/         # Esquemas de Mongoose (Participant, Stand, Visit, Survey)
├── routes/         # Definición de endpoints de la API (api.js)
└── server.js       # Punto de entrada de la aplicación y configuración
```

## ⚙️ Configuración Local

### Requisitos Previos

- Node.js v20 o superior.
- Una instancia de MongoDB (local o en la nube como MongoDB Atlas).

### Instalación

1. Clona el repositorio:

   ```bash
   git clone <url-del-repositorio>
   cd Francophonie-Backend
   ```

2. Instala las dependencias:

   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   Crea un archivo `.env` en la raíz del proyecto con el siguiente contenido:
   ```env
   MONGODB_URI=tu_cadena_de_conexion_a_mongodb
   PORT=5001
   ```

### Ejecución

Para iniciar el servidor en modo desarrollo:

```bash
npm run dev
```

El servidor estará disponible en `http://localhost:5001`.

## 🛰️ API Endpoints

### Participantes

- `GET /api/participants`: Obtener todos los participantes.
- `POST /api/participants`: Registrar un nuevo participante (genera código QR).
- `PUT /api/participants/:id`: Actualizar datos de un participante.
- `DELETE /api/participants/:id`: Eliminar un participante.

### Estands

- `GET /api/stands`: Listado de estands.
- `POST /api/stands`: Crear un nuevo estand.
- `PUT /api/stands/:id`: Editar un estand.
- `DELETE /api/stands/:id`: Eliminar un estand.

### Visitas y Escaneo

- `POST /api/visits/scan`: Registrar visita enviando `codigoQR` y `estandId`.

### Encuestas

- `GET /api/surveys`: Obtener todas las encuestas realizadas.
- `POST /api/surveys`: Enviar una nueva encuesta de satisfacción.

### Reportes y Analíticas

- `GET /api/reports/stats`: Estadísticas generales (total participantes, visitas, satisfacción promedio).
- `GET /api/reports/stand-visits`: Ranking de visitas por estand.
- `GET /api/reports/stand-analytics`: Datos comparativos de visitas y calificaciones.

## ☁️ Despliegue (Railway)

Este proyecto está configurado para desplegarse fácilmente en **Railway**.

- El servidor escucha en la interfaz `0.0.0.0`.
- Utiliza la variable de entorno `PORT` proporcionada por la plataforma.
- Asegúrate de configurar la variable `MONGODB_URI` en el panel de Railway.

---

© 2026 Evento - Sistema de Gestión de Participantes.
