const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = mongoose.connection;

  db.on('error', (error) => {
    console.error('Error de conexión a la base de datos:', error);
    reject(error);
  });

  db.once('open', () => {
    console.log('Conexión exitosa a la base de datos');
    resolve();
  });

  })
}

module.exports = connectDB;
