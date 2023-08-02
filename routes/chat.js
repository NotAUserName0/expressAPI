const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController')
const helper = require('../helpers/middleware')

router.use(express.json())

//obtiene mensajes del chat
router.post("/initChat", helper.tokenMiddleware, chatController.init)
//elimina chat por id
router.delete("/delChat/:id", helper.tokenMiddleware, chatController.deleteChat)
//crea un nuevo mensaje en chat
router.post("/newMessage",helper.tokenMiddleware, chatController.newMessage)

module.exports = router;