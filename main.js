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

app.use(morgan('dev')); // logs request in terminal
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // decodes json data to text 
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
  res.sendFile(path.join(__dirname+'/website/templates/'));
});

app.get('/signup',function(req,res){
  res.sendFile(path.join(__dirname+'/website/templates/'));
});

app.get('/profile',function(req,res){
  res.sendFile(path.join(__dirname+'/website/templates/profilePage.html'));
});

app.post('/api/rent-request/:PID',async function(req,res){

  var PostId = req.params.PID
  CurrentUser = await User.find({Cookie: req.cookies.auth})
  console.log()
  console.log(PostId);
  if (req.cookies.auth == undefined){
    res.send({"Status":1,"Msg":"Invalid Cookie"})
  }else {
    try{
      CurrentPost = await Post.findById(PostId);
    }catch(e){
      console.log(e);
      res.send({"Status":1,"Msg":"Invalid PostID"})
    }

    //console.log(CurrentPost);
  //console.log(CurrentUser)
  /*
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
  */
  
  res.send({"Status":0,"Msg":"Request Successfull"});
  }

  
})

app.listen(port, function(){
    console.log('Running server on port '+port);
});