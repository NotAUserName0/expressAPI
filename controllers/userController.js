const User = require('../models/user')
const Friends = require('../models/friends')
const jwt = require("jsonwebtoken")
const jwtDecode = require("jwt-decode")
const bcrypt = require("bcryptjs")
require('dotenv').config()

async function register(req, res) { //Recibe user,email,password por POST, regresa message
    try {

        if (req.body.user === undefined || req.body.email === undefined || req.body.password === undefined) {
            res.status(500).json({ error: "Not All data submited" });
        } else {
            const newUser = {
                user: req.body.user,
                email: req.body.email,
                password: await bcrypt.hash(req.body.password, 8)
            }

            const entry = await User.create(newUser);

            if (entry != 0) {
                const newFriendList = {
                    user: entry['id']
                }
                await Friends.create(newFriendList)
            }

            res.status(201).json({
                message: "User Registered"
            })
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function login(req, res) { //Recibe user password por POST, Regresa token
    try {

        if (req.body.user === undefined || req.body.password === undefined) {
            res.status(500).json({ error: "Not All data submited" });
        } else {
            const entry = await User.find({ user: req.body.user }) //Revisa y trae el usuario si existe

            if (entry != 0) { //si no hay usuario no hay login
                const enteredPass = req.body.password

                let passComparation = await bcrypt.compare(enteredPass, entry[0]['password'])

                if (!passComparation) {
                    res.status(500).json({ message: "Wrong password" });
                }

                //crea jwt token
                const claims = {
                    id: entry[0]['id'],
                    user: entry[0]['user'],
                    email: entry[0]['email'],
                    friends: entry[0]['friends'],
                }
                //firma token
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

async function addFriend(req, res) { //Recibe user por POST y el token por header, regresa mensaje de exito
    try {

        if (req.body.user === undefined) {
            res.status(500).json({ error: "User not submited" });
        } else {
            let payload = decodeJWT(req.token) //decodifica token del req
            let myId = payload.claims.id; //obtiene id, user del payload del token
            let myUser = payload.claims.user

            const inFriendList = await Friends.find( //query para saber si existe el user de POST en la lista de amigos del req.body.id
                { user: myId, "friend.name": req.body.user },
                { _id: 0, "friend.id": 1, "friend.name": 1 }
            )

            if (inFriendList != 0) { //si hay registro ya esta en la lista
                res.status(300).json({
                    error: "Already in friend list"
                })
            } else {

                //llega en req el nombre del amigo
                const userExist = await User.find({ user: req.body.user }) //Busca el user de POST para obtener sus datos

                let friendId = userExist[0]['id']
                let friendUsr = userExist[0]['user']

                if (userExist != 0) { //despues de este revisar si ya esta en la lista de amigos
                    await Friends.updateOne( //actualiza mis amigos
                        { user: myId },
                        { $push: { friend: { id: friendId, name: friendUsr } } }, //req
                    );


                    await Friends.updateOne( //actualiza sus amigos
                        { user: friendId },
                        { $push: { friend: { id: myId, name: myUser } } }, //req
                    );


                } else {
                    res.status(500).json({ error: "Usuario inexistente" });
                }

                res.status(201).json({
                    message: "Friend added"
                })
            }
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function delFriend(req, res) {
    //No revisa si existe el usuario pues si se agrego de amigo existe
    try {
        //Own Data
        let payload = decodeJWT(req.token) //decodifica token del req
        let myId = payload.claims.id;
        //Friend Data
        const delUser = req.params.id

        await Friends.updateOne(
            { user: myId },
            { $pull: { friend: { id: delUser } } }
        ) //elimina a delUser de mi lista de amigos

        await Friends.updateOne(
            { user: delUser },
            { $pull: { friend: { id: myId } } }
        ) //me elimina de su lista de amigos

        res.status(201).json({
            message: "Friend Deleted"
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }

}

function tokenMiddleware(req, res, next) { //Recibe el token por header, revisa que este bien y lo regresa en el req
    const bearerHeader = req.headers['authorization']

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(" ")[1];
        jwt.verify(bearerToken, process.env.SECRET_KEY, (error, auth) => {
            if (error) {
                res.status(403).json({ error: error.message })
            } else {
                req.token = bearerToken
                next()
            }
        })
    } else {
        res.status(403).json({ error: "You don't have access, please login." })
    }
}

function decodeJWT(token) { //decodifica token
    var decoded = jwtDecode(token)
    return decoded
}

module.exports = { //Hace visible las funciones en otros docs
    register,
    login,
    addFriend,
    delFriend,
    tokenMiddleware
}