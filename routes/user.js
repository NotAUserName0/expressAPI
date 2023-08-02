const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const helper = require('../helpers/middleware')

router.use(express.json())
//Inicia sesion
router.post("/login", userController.login); 
//Registra usuario
router.post("/register", userController.register);
//Añade amigos a la lista
router.post("/addFriend", helper.tokenMiddleware , userController.addFriend);
//elimina amigo de la lista
router.delete("/delFriend/:id", helper.tokenMiddleware, userController.delFriend);
//modifica usuario
router.put("/modUser", helper.tokenMiddleware, userController.modifyUserName);
//elimina usuario
router.delete("/delUser",helper.tokenMiddleware,userController.delUser);
//actualiza estado del usuario
router.post("/updateStatus", helper.tokenMiddleware, userController.changeStatus);
//obtiene lista de amigos
router.get("/friendStatus", helper.tokenMiddleware ,userController.friendsStatus)

module.exports = router;