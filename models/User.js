//Imports
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

//User Schema
const UserSchema = new mongoose.Schema({
  FirstName: {
    type: String,
    required: true,
  },
  LastName: {
    type: String,
    required: true,
  },
  Email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  Password: {
    type: String,
    min: 8,
    required: true,
  },
  JoinedAt: {
    type: Date,
    required: true,
    immutable: true,
    default: () => Date.now(),
  },
  Posts: {
    type: [mongoose.SchemaTypes.ObjectId],
    required: false,
  },
  PhoneNumber: {
    type: String,
    required: true,
    minLength: 10,
    maxLength: 10,
  },
  ProfileImg: {
    type: String,
    default: "DefaultImg.png",
  },
  Notifications: {
    type: [mongoose.SchemaTypes.ObjectId],
    require: false,
  },
  RentedCycles: {
    type: [mongoose.SchemaTypes.ObjectId],
    required: false,
  },
  Cookie: {
    type: String,
    requried: false,
  },
});

//Virtuals

UserSchema.virtual("Username").get(function () {
  return this.FirstName + " " + this.LastName;
});

//MiddleWare

UserSchema.pre("save", async function () {
  //Name Formatting
  this.FirstName =
    this.FirstName.charAt(0).toUpperCase() +
    (this.FirstName.length > 1 ? this.FirstName.substr(1).toLowerCase() : "");
  this.LastName =
    this.LastName.charAt(0).toUpperCase() +
    (this.LastName.length > 1 ? this.LastName.substr(1).toLowerCase() : "");

  //Password Hashing
  this.Password = await bcrypt.hash(this.Password, 5);

  //Continue
});

//Schema Methods
UserSchema.methods.VerifyPassword = function (Password) {
  return bcrypt.compare(Password, this.Password);
};

module.exports = UserSchema;
