const jwt = require("jsonwebtoken")
require('dotenv').config()

//Recibe el token JWT por header, revisa que este bien y lo regresa en el req
function tokenMiddleware(req, res, next) { 
    //obtiene el token por header
    const bearerHeader = req.headers['authorization']
    //mientras no este vacio
    if (typeof bearerHeader !== 'undefined') {
        //dividimos el token en 2 partes ya que viene como 'Bearer asasjkjndjand' y se le quita 'Bearer '
        const bearerToken = bearerHeader.split(" ")[1];
        //Verificamos la forma del token y si es correcta permite el paso al controlador, si no envia mensaje de error
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

module.exports = {
    tokenMiddleware
}