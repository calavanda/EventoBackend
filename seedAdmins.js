const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

// Parametrización segura de credenciales iniciales (MASVS-CODE / VULN-04)
const adminEmail = process.env.ADMIN_INITIAL_EMAIL;
const adminName = process.env.ADMIN_INITIAL_NAME || 'Admin Principal';

if (!adminEmail) {
  console.error("Variable ADMIN_INITIAL_EMAIL requerida para aprovisionamiento seguro.");
  process.exit(1);
}

const defaultAdmins = [
  { nombre: adminName, email: adminEmail.toLowerCase().trim(), rol: 'admin', activo: true },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI no encontrada en el .env");
    
    console.log('Intentando conectar a MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
    
    for (const p of defaultAdmins) {
      await Admin.findOneAndUpdate(
        { email: p.email.toLowerCase() },
        p,
        { upsert: true, new: true }
      );
      console.log(`Admin ${p.email} asegurado con éxito.`);
    }
    
    console.log('Seed seguro completado.');
    process.exit(0);
  } catch (err) {
    console.error('Error durante ejecución de seed:', err.message);
    process.exit(1);
  }
}

seed();
