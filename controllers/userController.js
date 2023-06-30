const User = require('../models/user')
const Friends = require('../models/friends')
const jwt = require("jsonwebtoken")
const jwtDecode = require("jwt-decode")
const bcrypt = require("bcryptjs")

async function register(req, res) {
    try {

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
            message: "user registered",
            user: entry['id']
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function login(req, res) {
    try {

        const entry = await User.find({ user: req.body.user })

        if (entry != 0) { //si no hay usuario no hay login
            //Comprobacion
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
            jwt.sign({ claims }, 'secretkey', (err, token) => {
                res.status(201).json({
                    message: "Logged",
                    token: token
                })
            })
        } else {
            res.status(500).json({ message: "Usuario inexistente" });
        }

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

async function addFriend(req, res) { //requiere token, y user:
    try {

        let payload = decodeJWT(req.token)
        let myId = payload.claims.id; //id recoge del header
        let myUser = payload.claims.user

        const inFriendList = await Friends.find(
            { user: myId, "friend.name": req.body.user },
            { _id: 0, "friend.id": 1, "friend.name": 1 }
        )

        if (inFriendList != 0) { //si hay registro ya esta de amigo
            res.status(300).json({
                message: "Already in friend list"
            })
        } else {

            //llega en req el nombre del amigo
            const userExist = await User.find({ user: req.body.user })

            let friendId = userExist[0]['id']
            let friendUsr = userExist[0]['user']

            console.log(friendId)
            console.log(myId)


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
                res.status(500).json({ message: "Usuario inexistente" });
            }

            res.status(201).json({
                message: "Ok"
            })

        }



    } catch (error) {
        res.status(500).json({ errorM: error.message });
    }
}

function tokenMiddleware(req, res, next) {
    const bearerHeader = req.headers['authorization']

    if (typeof bearerHeader !== 'undefined') {
        const bearerToken = bearerHeader.split(" ")[1];
        jwt.verify(bearerToken, 'secretkey', (error, auth) => {
            if (error) {
                res.status(403).json({ message: error.message })
            } else {
                req.token = bearerToken
                next()
            }
        })
    } else {
        res.status(403).json({ message: "You don't have access, please login." })
    }
}

function decodeJWT(token) {
    var decoded = jwtDecode(token)
    return decoded
}

module.exports = { //Hace visible las funciones en otros docs
    register,
    login,
    addFriend,
    tokenMiddleware
}