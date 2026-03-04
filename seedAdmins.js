const mongoose = require('mongoose');
const Admin = require('./server/models/Admin');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const participants = [
  { nombre: 'Admin Principal', email: '22610282@utgz.edu.mx', rol: 'admin', activo: true },
  { nombre: 'Alfredo', email: 'si@gmail.com', rol: 'admin', activo: true },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error("MONGODB_URI no encontrada en el .env");
    
    console.log('Intentando conectar a MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Conectado a MongoDB');
    
    for (const p of participants) {
      await Admin.findOneAndUpdate(
        { email: p.email.toLowerCase() },
        p,
        { upsert: true, new: true }
      );
      console.log(`Admin ${p.email} asegurado.`);
    }
    
    console.log('Seed completado.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

seed();
