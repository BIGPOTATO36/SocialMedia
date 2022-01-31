const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const User = new Schema({
    username: {
        type: String,
        required: true,
        min: 3,
        max: 30,
    },
    email: {
        type: String,
        required: true,
        min: 6,
        max: 255,
    },
    password: {
        type: String,
        required: true,
        min: 6,
        max: 1024
    },
    profilePicture: {
        type: String,
        min: 6,
        max: 1024
    },
    date: {
        type: Date,
        defult: Date.now
    }
}, {collection: "users"});
module.exports = mongoose.model("User",User);