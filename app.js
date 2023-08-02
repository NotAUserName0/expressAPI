/*

    INSTALACIONES Y PREPARACION PARA MANEJO DE APP

    npm init -y
    npm i express jsonwebtoken
    npm i jwt-decode
    npm i -g nodemon  
    npm install express mongoose
    npm i bcryptjs
    npm install dotenv
    npm install cors
    npm install socket.io


    npm run devStart        
    
    en el package.json, dentro de scripts : "devStart": "nodemon app.js",
*/

const express = require('express');

const app = express()

//Le asigno las instancias a el app para crear un servidor listo para Socket.io
const http = require('http').createServer(app);
const io = require('./socketConfig')(http);
//Declaro conexion de db
const connectDB = require('./db');
//Declaro manejo de cors
const cors = require('cors')
//agrego io a app
app.io = io
//Creo objeto de rutas
const userRoutes = require('./routes/user');
const chatRoutes = require('./routes/chat');

connectDB().then( //Primero verifico la conexion a la base de datos antes que nada
    () => {

        //al servidor le asigno permisos para cors
        app.use(cors({
            methods: ['GET', 'POST', 'PUT', 'DELETE'],
            credentials: true
        }))

        /*
            Manejo datos de salas de chat
            ***Se declara primero el socket para poder ser usado en las rutas
        */

        //creo una instancia para socket.io el cual escucha el mensaje 'connect' para inicial la conexion al cliente
        io.on('connect', (socket) => {
            //una vez conectado al cliente envio un mensaje
            console.log("conected: ");
            //Hago una instancia que escucha si se envio un mensaje a una room
            socket.on('sendMessage', (roomName) => {
                console.log("mensaje recibido para: "+roomName);
                //si escuha el mensaje emite un mensaje al cliente
                io.to(roomName).emit('messageUpdated', ()=>{
                    console.log("msg actualizados")
                });
              });

            // escucho para crear una sala de chat o room
            socket.on('joinRoom', (roomName)=>{
                //si escucha se una a una sala
                socket.join(roomName)
                console.log(`Cliente ${socket.id} se unio a la room ${roomName}`)
            })

            //escucho si se quiere salir de la sala
            socket.on('leaveRoom', (roomName) => {
                //si escuha deja la sala de chat
                socket.leave(roomName);
                console.log(`Cliente ${socket.id} se desconectó de la room ${roomName}`);
              });

            //si el socket escucha este mensaje deesconecta el socket principal
            socket.on('disconnect', () => {
                console.log("disconected")
            })
        })

        /*DEFINICION DE RUTAS */
        app.use('/user', userRoutes)
        app.use('/chat', chatRoutes)

        app.get("/", (req, res) => {
            res.json({
                message: "Chat app API"
            })
        });
        /* INICIA EL SERVIDOR CON HTTP POR EL SOCKET*/
        http.listen(3000, function () {
            console.log("Server On");
        })

    }
).catch((error) => {
    console.error('No database', error)
})

