//Imports
const mongoose = require("mongoose");
const UserSchema = require("./models/User");
const User = mongoose.model("User", UserSchema);

//Database Connection CallBack Function
mongoose.connection.on("connected", () => {
  console.log("AWP Databse Connected: True");
});

//Establishing Database Connection
try {
  mongoose.set("strictQuery", false);
  mongoose.connect("mongodb://localhost/AWP");
  console.log("Mongo connected");
} catch (error) {
  console.log(error);
  process.exit();
}

async function run() {
  //User Details
  var user1 = new User({
    FirstName: "Test",
    LastName: "User",
    Email: "TestUser@Testing.com",
    Password: "TestPass",
    PhoneNumber: "0123456789",
  });

  //Saving to Database
  try {
    await user1.save();
  } catch (e) {
    console.log(e.message);
  }

  //Displaying User & Password Verification
  console.log(user1);
  console.log(await user1.VerifyPassword("0123456789"));

  //Exit
  process.exit();
}

//ScriptExec
run();
