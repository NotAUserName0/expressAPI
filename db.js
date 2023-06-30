const mongoose = require('mongoose');

const connectDB = () => {
  return new Promise((resolve, reject) => {
    mongoose.connect('mongodb://127.0.0.1:27017/redSocial', {
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
