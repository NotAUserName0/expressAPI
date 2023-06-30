const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
    user:{
        type: String,
        required : true,
        unique: true,
        validate: {
            validator: async function(value){
                const entry = await this.constructor.findOne({ user: value });
                return !entry;
            },
            message:'Usuario ya existente'
        }
    },
    email: {
        type: String,
        required : true,
    },
    password:{
        type: String,
        required : true,
    },
    
},{
    versionKey: false
})

module.exports = mongoose.model('User',userSchema) 
//El primer parametro es la coleccion, el segundo es el tipo de datos que va a llegar a la coleccion