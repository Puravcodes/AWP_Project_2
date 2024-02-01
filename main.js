var express = require('express');
var app = express();
var port = process.env.PORT||8080;
var morgan = require('morgan');
var mongoose = require('mongoose');
var router = express.Router();
var path = require('path');
var UserSchema = require("./models/User");
var User = mongoose.model("User",UserSchema);
var PostSchema = require("./models/Post")
var Post = mongoose.model("Post",PostSchema);
var NotificationSchema = require("./models/Notification");
var Notification = mongoose.model("Notification",NotificationSchema);
var CookieParser = require("cookie-parser");
const { Console } = require('console');

//Importing UserSchema Model
const { error } = require('console');
mongoose.connection.on("connected", () => {
  console.log("AWP Databse Connected");
});

//Express Session
const session = require('express-session');

//Express Flash
const flash = require('express-flash');

//Session
app.use(session({
  secret : "secret key",
  resave: false,
  saveUninitialized: true,
  cookie : {
    maxAge : 60000
  }
}));
app.use(flash());

//bodyParse
const bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

//View Engine
app.set('view engine','ejs');

// logs request in terminal
app.use(morgan('dev')); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: false })); // decodes json data to text 
app.use(express.static(path.join(__dirname + '/website/templates')));
app.use(CookieParser());
//loading each folder from assets folder
app.use('/assets', express.static(path.join(__dirname, '/assets')));


async function connectToDatabase(){
    try{
      await mongoose.connect('mongodb://localhost:27017/AWP',{
        useNewUrlParser: true,
        useUnifiedTopology: true
    });
      console.log('Connected Successfully');
    }catch(err){
      console.error(err);
    }
};
connectToDatabase();

app.get('/', function(req,res){
  res.sendFile(path.join(__dirname + '/website/templates/index.html'));
});

app.get('/login', function(req,res){
  res.render(path.join(__dirname+'/website/templates/loginPage.ejs'),{ messages: req.flash() });
});

app.post('/login', async (req,res) => {
try { 
const { email, password } = req.body;
const user = await User.findOne({ Email : email });
if(!user){
  throw new Error("Email Does Not Exists")
}
if(await user.VerifyPassword(password)) {
  if(res.status(201)){
    res.send('Logged In');
  }else{
    throw new Error("WRONG Password");
  }
}
else{
  throw new Error("Incorrect Password");
}
}
catch(error){
req.flash("error" , error.message)
return res.redirect('login');
} 

})

app.get('/signup',function(req,res){
  res.render(path.join(__dirname+'/website/templates/signupPage.ejs'),{ messages: req.flash() });
});

app.post('/signup', async (req,res) => {
  try{
    const { firstname, lastname, email, password, phoneNumber } = req.body;
    const data = new User ({
    FirstName: firstname,
    LastName: lastname,
    Email: email,
    Password: password,
    PhoneNumber: phoneNumber,
  });
  await data.save();
  res.redirect('login');
}catch(error){
  console.error('Error creating post:', error);
  if(res.status(500)){
    if(error.code == 11000){
      req.flash("error" , "Account Already Registered with the Given Email"); 
    }
    return res.redirect('signup');
  }
  
}
});

app.get('/profile',function(req,res){
  res.sendFile(path.join(__dirname+'/website/templates/profilePage.html'));
});

app.post('/api/rent-request/:PID',async function(req,res){

  var PostId = req.params.PID
  Users = await User.find({Cookie: req.cookies.auth})
  console.log()
  console.log(PostId);
  if (req.cookies.auth == undefined || Users == []){
    res.send({"Status":1,"Msg":"Invalid Cookie"})
  }else {
    try{
      CurrentUser = Users[0]
      CurrentPost = await Post.findById(PostId);
    }catch(e){
      //console.log(e);
      res.send({"Status":1,"Msg":"Invalid PostID"})
      return 
    }

    console.log(CurrentPost);
    console.log(CurrentUser)
  
    var notification1 = new Notification({
      Title : "Request To Rent " + CurrentPost.Model,
      Description : " A User Wants To Rent Your Cycle.",
      Status : true,
      ApprovalNeeded : true,
      Users : {
        Leaser : CurrentPost.OwnerID,
        Renter : CurrentUser.id
      }
    })
    try{
      await notification1.save();
    }catch(e){
      console.log(e);
      res.send({"Status":1,"Msg":"Error Occured While Processing"})
      return ;
    }
  
    res.send({"Status":0,"Msg":"Request Successfull"});
  }

  
})

app.listen(port, function(){
    console.log('Running server on port '+port);
});