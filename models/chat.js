const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    userA:{ //siempre sera el creador
        type:String,
        required:true
    },
    userB:{
        type:String,
        required:true
    },
    name:{
        type:String,
        required:true
    },
    messages:{
        type: [Object],
        /*emisor:{
            type:String,
            required:true
        },
        text:{
            type:String,
        },
        date:{
            type:String
        },
        status:{
            type:String,
        }*/
    }
},{
    versionKey: false
})

module.exports = mongoose.model('Chat',chatSchema)