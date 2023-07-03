const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.use(express.json())

router.post("/login", userController.login);

router.post("/register", userController.register);

router.get("/loadFriends", userController.tokenMiddleware, userController.loadUsers);

router.post("/addFriend", userController.tokenMiddleware , userController.addFriend);

router.delete("/delFriend/:id", userController.tokenMiddleware, userController.delFriend);

router.put("/modUser", userController.tokenMiddleware, userController.modifyUserName);

router.delete("/delUser",userController.tokenMiddleware,userController.delUser)

module.exports = router;