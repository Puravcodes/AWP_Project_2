//Imports
const mongoose = require("mongoose")
const User = require("./User")

//Schema
const NotificationSchema = mongoose.Schema({
    Title : {
        type: String,
        required: true,
        minLength: 8
    },
    Description : {
        type: String,
        required: true
    },
    Status : Boolean,
    ApprovalNeeded : Boolean,
    Approved : {
        type: String,
        required: false,
        default: "Pending"
    },
    Users : {
        Leaser : {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            required: true
        },
        Renter : {
            type: mongoose.SchemaTypes.ObjectId,
            ref: "User",
            required: true
        }
    }
})

//Exports
module.exports = NotificationSchema;