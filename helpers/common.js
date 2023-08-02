const jwtDecode = require("jwt-decode")
const { format } = require('date-fns');

function decodeJWT(token) { //decodifica token
    var decoded = jwtDecode(token)
    return decoded
}

function randomizeStrings(cadena1,cadena2) { //toma dos cadenas y las combina
    let resultado = "";
    for (let i = 0; i < cadena1.length; i++) {
        resultado += cadena1[i] + cadena2[i];
    }

    return resultado;
}

function getFormattedDateTime() { //crea un formato de fecha para los mensajes
  const now = new Date();
  const formattedDate = format(now, "HH':'mm - dd/MM/yy");
  return formattedDate;
}

module.exports = {
    decodeJWT,
    randomizeStrings,
    getFormattedDateTime
}