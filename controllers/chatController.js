const Chat = require('../models/chat')
const jwt = require("jsonwebtoken")
const jwtDecode = require("jwt-decode")
const bcrypt = require("bcryptjs")
const common = require('../helpers/common')
const { ObjectId } = require('mongodb');
require('dotenv').config()

//recibe id, regresa documento chat
async function init(req, res) {
    try {
        //obtiene datos del body
        let id = req.body.id
        //Busca en Chat por id
        const entry = await Chat.find(
            { _id: new ObjectId(id) }
        )

        res.status(200).json(
            {
                _id: entry[0]['_id'],
                userA: entry[0]['userA'],
                userB: entry[0]['userB'],
                name: entry[0]['name'],
                messages: entry[0]['messages'],
            }
        )

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//recibe id, regresa message
async function deleteChat(req, res) {
    try {
        //obtiene datos del body
        let id = req.params.id
        //Elimina en Chat por id
        await Chat.deleteOne(
            { _id: new ObjectId(id) }
        )
        res.status(200).json({ message: "Chat deleted" })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}
//recibe text, chatID, regresa message
async function newMessage(req, res) {
    try {
        //obtiene datos del token
        let payload = common.decodeJWT(req.token)
        let myUser = payload.claims.user
        //obtiene datos del body
        let newMessage = req.body.text
        let chatId = req.body.chatID
        //añade los datos por en el chat
        await Chat.updateOne(
            { _id: new ObjectId(chatId) },
            {
                $push: {
                    messages: {
                        emisor: myUser,
                        text: newMessage,
                        date: common.getFormattedDateTime(),
                        status: "false"
                    }
                }
            }
        );

        res.status(201).json({
            message: "message sent"
        })

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
}

module.exports = {
    init,
    deleteChat,
    newMessage
}