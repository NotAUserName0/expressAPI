const mongoose = require('mongoose');
require('dotenv').config();

//creo una instancia para conectar a DB
const connectDB = () => {
  //como regresa una promesa la manejo en una funcion
  return new Promise((resolve, reject) => {
    mongoose.connect(process.env.URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }); //Proceso la entrada a la base de datos, aqui se coloca la password si ocupa

  //Una vez conectada manejo la conexion con la variable db
  const db = mongoose.connection; 

  //Si db escucha un error de la connection cancela todo e imprime mensaje
  db.on('error', (error) => {
    console.error('Error de conexión a la base de datos:', error);
    reject(error);
  });

  //Si db regresa open significa que la conexion fue exitosa y la promesa regresa la coneccion a la bd
  db.once('open', () => {
    console.log('Conexión exitosa a la base de datos');
    resolve();
  });

  })
}

module.exports = connectDB;
