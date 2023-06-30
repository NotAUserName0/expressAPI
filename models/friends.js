const mongoose = require('mongoose')

const friendSchema = new mongoose.Schema({
    user:{
        type:String,
        required:true
    },
    friend:{
        type: [Object]
        /*id:{
            type: String,
        },
        user:{
            type:String,
        }*/
    }
},{
    versionKey: false
})

module.exports = mongoose.model('Friend',friendSchema)