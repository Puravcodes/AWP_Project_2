var express = require('express');
var app = express();
var port = process.env.PORT||8080;
var morgan = require('morgan');
var mongoose = require('mongoose');
var router = express.Router();
var path = require('path');
const multer = require('multer');

//importing database schemas
var UserSchema = require("./models/User");
var User = mongoose.model("User",UserSchema);
var PostSchema = require("./models/Post")
var Post = mongoose.model("Post",PostSchema);
var NotificationSchema = require("./models/Notification");
var Notification = mongoose.model("Notification",NotificationSchema);

//cookie parser
var CookieParser = require("cookie-parser");
const { Console } = require('console');
var jwt = require('jsonwebtoken');

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

const storage = multer.diskStorage({
  destination: './assets/img',
  filename: (req, file, cb) => {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage });



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

//Routes
app.get('/', function(req,res){
  res.sendFile(path.join(__dirname + '/website/templates/index.html'));
});

app.get('/login', function(req,res){
  res.render(path.join(__dirname+'/website/templates/loginPage.ejs'),{ messages: req.flash() });
});

app.post('/login', async (req,res,next) => {
try {
const { email, password } = req.body;
const user = await User.findOne({ Email : email });
if(!user){
  throw new Error("Email Does Not Exists");
}
if(await user.VerifyPassword(password)) {
  if(res.status(201)){
    var myquery = { Email : email};
    function genRandonString(length) {
      var chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var charLength = chars.length;
      var result = '';
      for ( var i = 0; i < length; i++ ) {
         result += chars.charAt(Math.floor(Math.random() * charLength));
      }
      return result;
   }
    var ck = genRandonString(10);
   res.cookie('auth' , ck, {
    httpOnly : true,
  }); 
   await User.updateOne(myquery, {Cookie : ck});
    res.redirect('/');
    next();
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
return res.redirect('/login');
} 
});

app.get('/logout',async (req,res) => {
  try {
  await User.findOneAndUpdate({Cookie : req.cookies.auth},{Cookie : null});
  await res.clearCookie('auth');
  await res.redirect('/login');
}catch(error){
  res.send(error.message);
  }
});

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
  res.redirect('/login');
}catch(error){
  console.error('Error creating post:', error);
  if(res.status(500)){
    if(error.code == 11000){
      req.flash("error" , "Account Already Registered with the Given Email"); 
    }
    return res.redirect('/signup');
  }
  
}
});

app.get('/profile', async function (req,res){
  try{
    if (req.cookies.auth==null||req.cookies.auth==undefined){
      res.redirect('/login');
      return;
    }
    var requser = await User.find({Cookie : req.cookies.auth});
    var currentuser = requser[0];

    var postid = currentuser.Posts;
    console.log(postid);

    var postlist = [];
    for (let i = 0; i < postid.length; i++) { 
      var posts = await Post.findById(postid[i]);
      if (posts) {

        //Description cut off at end for '...'
        var Desc1 = posts.Description;
        var Desc2 = Desc1.split(' ');
        var Description = Desc2.slice(0, 20).join(' ') + '...';

        //Date format function for Posts
        let dateObject = new Date(posts.PostedAt);
        let day = dateObject.getDate();
        let month = dateObject.getMonth() + 1;
        let year = dateObject.getFullYear(); 
        let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        let dayName = daysOfWeek[dateObject.getDay()];
        let formattedDatePosts = `${dayName} ${day}-${month}-${year}`;


        let newobj = {
          Model: posts.Model,
          Img: posts.Img,
          Description: Description,
          PostedAt: formattedDatePosts,
          Price: posts.Price,
          PID: postid[i],
        }; 
        postlist.push(newobj); 
      }
    }
    console.log(postlist);

    //Date format function for user
    let dateObject = new Date(currentuser.JoinedAt);
    let day = dateObject.getDate();
    let month = dateObject.getMonth() + 1;
    let year = dateObject.getFullYear(); 
    let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    let dayName = daysOfWeek[dateObject.getDay()];
    let formattedDateUser = `${dayName} ${day}-${month}-${year}`;


    var user = ({
      Username: currentuser.Username,
      Email: currentuser.Email,
      Password: currentuser.Password,
      JoinedAt: formattedDateUser,
      PhoneNumber : currentuser.PhoneNumber,
      ProfileImg: currentuser.ProfileImg,
    })


      res.render(path.join(__dirname,'./website/templates/profilePage.ejs'),{user:user, post:postlist});
    }catch(error){
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
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

app.get('/create-post', async (req, res) => {
  try{
    if (req.cookies.auth==null||req.cookies.auth==undefined){
      res.redirect('/login');
      return;
    }
    var requser = await User.find({Cookie : req.cookies.auth});
    var currentuser =requser[0];
    var user = ({
      Username: currentuser.Username,
      ProfileImg: currentuser.ProfileImg,
    })
      res.render(path.join(__dirname,'./website/templates/createPost.ejs'),{user:user});
    }catch(error){
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

app.post('/create-post', upload.single('image'), async (req, res) => {
  try {
    
    if (req.cookies.auth == undefined || req.cookies.auth == null) {
      res.redirect('/login');
      return;
    }
    const Users = await User.find({ Cookie: req.cookies.auth });
    CurrentUser = Users[0];
    var OwnerID = CurrentUser.id;
    const { Model, Condition, Price, Description, Location } = req.body;
    const Img = req.file ? `${req.file.filename}` : null;

    
    const newPost = new Post({
      Model,
      Img,
      Condition,
      Price,
      Description,
      OwnerID,
      Location,
    });

    
    await newPost.save();
    var PostId = newPost.id; 
    await User.findOneAndUpdate({Cookie: req.cookies.auth}, {$push:{Posts: PostId}});

    res.send('Post created successfully!');
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).send('Internal Server Error');
  }
});


app.get('/post/:pid', async function (req, res) {
  try {
    if (!req.cookies.auth) {
      res.redirect('/login');
      return;
    }
    var requser = await User.find({Cookie : req.cookies.auth});
    var currentuser =requser[0];
    var user = ({
        Username: currentuser.Username,
        ProfileImg: currentuser.ProfileImg,
      })
    
    const postId = req.params.pid;
    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).send('Post not found');
      return;
    }
    res.render(path.join(__dirname, './website/templates/postview.ejs'), { post:post ,user: user });
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(port, function(){
    console.log('Running server on port '+port);
});
