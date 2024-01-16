const mongoose = require("mongoose")
const UserSchema  = require("./models/User")
const User = mongoose.model("User", UserSchema)
mongoose.connection.on("connected",()=>{console.log("AWP Databse Connected: True")})
try {
    mongoose.set('strictQuery', false)
    mongoose.connect("mongodb://localhost/AWP")
    console.log('Mongo connected')
}catch(error) {
    console.log(error)
    process.exit()
}
//console.log(User)
run()
async function run(){
    var user1 = new User({
        FirstName : "elroy",
        LastName: "crasto",
        Email : "elroy@gmail.com",
        Password : "Elroy123",
        PhoneNumber : "8855827543",
    })
    try{
        await user1.save()
    }catch (e){
        console.log(e.message)
    }
    console.log(user1.Username)
}