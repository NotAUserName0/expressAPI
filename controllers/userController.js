const User = require('../models/user')
const Friends = require('../models/friends')
const Chat = require('../models/chat')
const jwt = require("jsonwebtoken")
const bcrypt = require("bcryptjs")
const common = require('../helpers/common')
require('dotenv').config()

//Recibe user,email,password, regresa message
async function register(req, res) {
    try {
        if (req.body.user === undefined || req.body.email === undefined || req.body.password === undefined) {
            res.status(500).json({ error: "Not All data submited" });
        } else {
            //Crea objeto nuevo usuario
            const newUser = {
                user: req.body.user,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 8),
                status: 'offline'
            }
            //Registra newUser y regresa el dato agregado
            const entry = await User.create(newUser);

            /* 
                Si entry tiene valor significa que no existe el usuario
                entonces manda error, no se registra ni crea lista de amigo
            */
            if (entry != 0) {
                //crea objeto lista de amigos con el id generado del registro
                const newFriendList = {
                    user: entry['id']
                }
                //crea un registro en la coleccion Friends
                await Friends.create(newFriendList)
            }

            res.status(200).json({
                message: "User Registered"
            })
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//Recibe user,password, regresa token
async function login(req, res) {
    try {

        if (req.body.user === undefined || req.body.password === undefined) {
            res.status(500).json({ error: "Not All data submited" });
        } else {
            //Se busca el dato por user del body
            const entry = await User.find({ user: req.body.user })
            //si encuentra el usuario procede al login
            if (entry != 0) {
                /*
                    Obtiene password del body y la compara con 
                    la password obtenida del registro de la coleccion
                */
                const enteredPass = req.body.password
                let passComparation = await bcrypt.compare(enteredPass, entry[0]['password'])
                if (!passComparation) {
                    res.status(500).json({ error: "Wrong password" });
                }
                //Obtengo el valor io que es el de el Socket.io
                const io = req.app.io
                //Cambio a online a el usuario loggeado
                changeStatusMethod(entry[0]['id'], "online")
                //Realiza un emit para actualizar la lista de amigos de todos los usuarios
                io.sockets.emit('reloadFriendList', () => {
                    console.log("Login status completed")
                })

                //Declaramos en un objeto los claims o info del token
                const claims = {
                    id: entry[0]['id'],
                    user: entry[0]['user'],
                    email: entry[0]['email'],
                    status: "online"
                }
                //Se firma el token y lo regreso por response
                jwt.sign({ claims }, process.env.SECRET_KEY, (err, token) => {
                    res.status(201).json({
                        token: token
                    })
                })
            } else {
                res.status(500).json({ error: "Usuario inexistente" });
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//Recibe user, regresa mensaje de exito
async function addFriend(req, res) {
    try {

        if (req.body.user === undefined) {
            res.status(500).json({ error: "User not submited" });
        } else {
            /*
                Obtengo valores  del token por una funcion decodeJWT
                los datos del header se obtienen req.
            */
            let payload = common.decodeJWT(req.token)
            let myId = payload.claims.id;
            let myUser = payload.claims.user
            //Se busca el id de el amigo en la lista de amigos
            const inFriendList = await Friends.find(
                { user: myId, "friend.name": req.body.user },
                { _id: 0, "friend.id": 1, "friend.name": 1 }
            )
            //si hay registro ya esta en la lista y manda error
            if (inFriendList != 0) {
                res.status(300).json({
                    error: "Already in friend list"
                })
            } else {
                //Busca el amigo en la lista de usaurios para obtener unos datos
                const userExist = await User.find({ user: req.body.user })
                //Si existe el amigo
                if (userExist != 0) {
                    //asigno los valores obtenidos de userExist
                    let friendId = userExist[0]['id']
                    let friendUsr = userExist[0]['user']
                    /*
                        Con mi ID obtenido de el token y el ID de el amigo de userExist
                        creo una cadena unica para posteriormente usarla de nombre
                        para room en Socket.io
                    */
                    let chatName = common.randomizeStrings(myId, friendId)

                    //Creo un objeto para la sala de chat, es decir el chat para los usaurios seleccionados
                    const newChat = {
                        name: chatName,
                        userA: myUser,
                        userB: friendUsr
                    }
                    //crea un registro en la colleccion chat
                    const ch = await Chat.create(newChat)

                    await Friends.updateOne( //actualiza mis amigos
                        { user: myId },
                        { $push: { friend: { id: friendId, name: friendUsr, chatID: ch.id } } },
                    );

                    await Friends.updateOne( //actualiza sus amigos
                        { user: friendId },
                        { $push: { friend: { id: myId, name: myUser, chatID: ch.id } } },
                    );


                } else {
                    res.status(500).json({ error: "Usuario inexistente" });
                }
                //Obtengo el dato io de Socket.io y emito un mensaje para actualizar la lista de amigos
                const io = req.app.io
                io.sockets.emit('reloadFriendList', () => {
                    console.log("Amigo agregado, actualizando lista...")
                })

                res.status(201).json({
                    message: "Friend added"
                })
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//Recibe id por parametro, regresa mensaje
async function delFriend(req, res) {
    try {
        //Obtengo mis datos por el token jwt
        let payload = common.decodeJWT(req.token)
        let myId = payload.claims.id;
        //Obtengo los datos por parametro
        const delUser = req.params.id

        //elimina a delUser de mi lista de amigos
        await Friends.updateOne(
            { user: myId },
            { $pull: { friend: { id: delUser } } }
        )
        //me elimina de su lista de amigos
        await Friends.updateOne(
            { user: delUser },
            { $pull: { friend: { id: myId } } }
        )
        //Obtengo el dato io de Socket.io y emito un mensaje para actualizar la lista de amigos
        const io = req.app.io
        io.sockets.emit('reloadFriendList', () => {
            console.log("Amigo eliminado, actualizando lista...")
        })

        res.status(201).json({
            message: "Friend Deleted"
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}
//Recibe user, regresa token refresh
async function modifyUserName(req, res) {
    try {

        if (req.body.user === undefined) {
            res.status(500).json({ error: "User not submited" });
        } else {
            //Obtengo datos para trabajar del token y del body
            let payload = common.decodeJWT(req.token)
            let myId = payload.claims.id;
            let newUserName = req.body.user;

            //Actualiza mi nombre en el documento
            await User.updateOne(
                { _id: myId },
                { $set: { user: newUserName } }
            )
            //Actualiza mi nombre en todas las listas de amigos donde aparezca
            await Friends.updateMany(
                { "friend.id": myId },
                { $set: { "friend.$.name": newUserName } }
            )

            //Declaramos en un objeto los claims o info del token para un refresh por el cambio de nombre
            const claims = {
                id: myId,
                user: newUserName,
                email: payload.claims.email,
                status: "online"
            }

            //Se firma el token y lo regreso por response
            jwt.sign({ claims }, process.env.SECRET_KEY, (err, token) => {
                //Obtengo el dato io de Socket.io y emito un mensaje para actualizar la lista de amigos
                const io = req.app.io
                io.emit('reloadFriendList', () => {
                    console.log("modify user name")
                })
                res.status(201).json({
                    token: token
                })
            })

        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function delUser(req, res) { //elimina usuario
    try {

        let payload = common.decodeJWT(req.token) //decodifica token del req
        let myId = payload.claims.id;

        await Friends.updateMany( //elimina mi usr de la lista de amigos de todos los usuarios
            {},
            { $pull: { "friend": { id: myId } } }
        )

        await Friends.deleteOne( //elimina mi lista de amigos 
            { user: myId }
        )

        await User.deleteOne( //elimina usuario de la lista de user
            { _id: myId }
        )

        res.status(201).json({
            message: "User deleted succesfully"
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//recibe status, regresa message
async function changeStatus(req, res) {
    try {
        if (req.body.status === undefined) {
            res.status(500).json({ error: "¿Status?" });
        } else {

            //Obtengo los datos del token
            let payload = common.decodeJWT(req.token)
            let myId = payload.claims.id;
            //Hago update en la colecion User obteniendo el status por rq
            await User.updateOne(
                { _id: myId },
                { $set: { status: req.body.status } }
            )
            //Obtengo el dato io de Socket.io y emito un mensaje para actualizar la lista de amigos
            const io = req.app.io
            io.emit('reloadFriendList', () => {
                console.log("changeStatus")
            })

            res.status(201).json({
                message: "Status updated :)"
            })
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

//no recibe nada mas que el token por header y regresa la lista de amigos con cierto formato
async function friendsStatus(req, res) {

    try {

        //Obtengo datos del token 
        let payload = common.decodeJWT(req.token)
        let myUser = payload.claims.user;

        //Hago una recoleccion de datos entre User y Friends
        await User.aggregate([
            { $match: { user: myUser } }, //Busco registro en Users que coincida con mi ID
            {
                $lookup: { //Con esta funcion hago un JOIN 
                    from: "friends", //Hago el JOIN con Friends
                    let: { userId: { $toString: "$_id" } }, //Convierto los ObjectId a string guardada en userID para mejorar busqueda
                    pipeline: [ //tuberia para recolectar datos de FRiends
                        {
                            $match: { //Obtiene todo lo que haga match userID con userId
                                $expr: { $eq: ["$$userId", { $toString: "$user" }] }
                            }
                        },
                        {
                            $project: { //con esta funcion limito los datos obtenidos del query
                                _id: 0, //No obtengo _id del documento de Friends, y del objeto friend obtengo todo
                                friend: {
                                    id: 1,
                                    name: 1,
                                    chatID: 1
                                }
                            }
                        }
                    ],
                    as: "friendDetails" //regreso la informacion de la tuberia con este nombre
                }
            },
            {
                $unwind: "$friendDetails" //le doy formato a la respuesta para hacerlo parte de el resultado de User
            },
            {
                $project: { //Mientras tanto de user solo obtengo el nombre
                    _id: 0,
                    password: 0,
                    email: 0,
                }
            }
        ])
            .then(  //Despues de obtener el registro llamado document le doy formato
                document => {
                    //obtengo unicamente la lista de amigos del documento
                    const listaUsers = document[0]['friendDetails']['friend']
                    //vuelvo objeto el resultado json
                    const array = Object.values(listaUsers);
                    //le aplico la funcion getStatus a cada elemento del objeto y guardo sus promesas
                    const promises = array.map((element) => getStatus(element));
                    //Manejo sus promesas
                    Promise.all(promises)
                        .then((results) => { 
                            /*
                                Mapeo los resultados de cada promesa creando un objeto para posteriormente almacenarlos
                                en una variable
                            */
                            const newFriends = results.map((res) => ({ //array final
                                id: res.id,
                                name: res.name,
                                status: res.status,
                                chatID: res.chatID
                            }));

                            res.status(201).send(newFriends)
                        })
                        .catch((error) => {
                            console.error(error);
                        });

                }
            )
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

/*
    Funciones sin req ni res
*/

//recibe id, status, no regresa nada
async function changeStatusMethod(id, status) {
    try {
        //actualiza estado por id
        await User.updateOne( 
            { _id: id },
            { $set: { status: status } }
        )

    } catch (error) {
        console.log("Login status failed: " + error)
    }
}
//Recibe objeto friend(id), regresa el status de friend
async function getStatus(friend) {
    let status; //variable de control
    try {
        //Busca el friend por id
        await User.findOne(
            { _id: friend.id }
        ).then(
            document => {
                //obtengo el status actual
                status = document.status;
                //asigno status actual
                friend.status = status
            }
        )
        //regreso el objeto friend actualizado
        return friend
    } catch (error) {
        return json({
            error: "No status"
        })
    }
}

module.exports = { //Hace visible las funciones en otros docs
    register,
    login,
    addFriend,
    delFriend,
    modifyUserName,
    delUser,
    changeStatus,
    friendsStatus,
}