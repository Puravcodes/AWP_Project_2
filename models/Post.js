const mongoose = require("mongoose");
const UserSchema = require("./User");
const User = mongoose.model("User",UserSchema)

const PostSchema = mongoose.Schema({
    Model : {
        type: String,
        required: true,
    },
    Img : {
        type: String,
        required: true,
    },
    Condition : {
        type: String,
        required: true
    },
    Price : Number,
    Description : {
        type : String,
        required : true,
        maxLength : 1024
    },
    PostedAt : {
        type: Date,
        requried: true,
        immutable: true,
        default: ()=>Date.now()
    },
    IsRented : {
        type: Boolean,
        required: true,
        default: false
    },
    CurrentRenter : {
        type: mongoose.SchemaTypes.ObjectId,
        ref: User
    },
    Location : {
        type: String,
        max: 999999,
        min: 100000 
    }
})