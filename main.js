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


//Functions 


//Date format function for Posts (posts.PostedAt)
function dateParser(rawDate){
  let dateObject = new Date(rawDate);
  let day = dateObject.getDate();
  let month = dateObject.getMonth() + 1;
  let year = dateObject.getFullYear(); 
  let daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  let dayName = daysOfWeek[dateObject.getDay()];
  let formattedDatePosts = `${dayName} ${day}-${month}-${year}`;
  return formattedDatePosts;
}

//Function to show posted how many days ago
function formatPostDateAgo(postDate) {
  let postDateTime = new Date(postDate).getTime(); 
  let currentDateTime = new Date().getTime(); 
  let differenceInMs = currentDateTime - postDateTime;
  let differenceInDays = Math.floor(differenceInMs / (1000 * 60 * 60 * 24)); 
  return differenceInDays;
}

//Routes
app.get('/home', async (req,res) => {
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
    });
      var userpost = await Post.find({});
      var postsArray = [];
      for (let i = 0; i < userpost.length; i++) {
        var currentposts = userpost[i];
        if (currentposts.Model !== undefined) {
          var post = {
            Model: currentposts.Model,
            Img: currentposts.Img,
            Price: currentposts.Price,
            Location: currentposts.Location,
            Condition: currentposts.Condition,
            PID : currentposts._id,
            Date : formatPostDateAgo(currentposts.PostedAt)
          };
          postsArray.push(post); 
        }
      }
      res.render(path.join(__dirname, './website/templates/index.ejs'), { user: user, post: postsArray });
    } catch (error) {
      console.log(error);
      res.status(500).send('Internal Server Error');
    }
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
    res.redirect('/home');
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

app.get('/logout', async (req,res) => {
  try {
  await User.findOneAndUpdate({Cookie : req.cookies.auth},{Cookie : null});
  await res.clearCookie('auth');
  await res.redirect('/');
}catch(error){
  res.send(error.message);
  }
});

app.get('/signup',function(req,res){
  res.render(path.join(__dirname+'/website/templates/signupPage.ejs'),{ messages: req.flash() });
});

app.post('/signup', upload.single('image'), async (req,res) => {
  try{
    const { firstname, lastname, email, password, phoneNumber } = req.body;
    const image = req.file ? `${req.file.filename}` : null;
    const data = new User ({
    FirstName: firstname,
    LastName: lastname,
    Email: email,
    Password: password,
    PhoneNumber: phoneNumber,
    ProfileImg : image
  });
  await data.save();
  req.flash("Success", "Account Created Successfully");
  res.redirect('/login');
}catch(error){
  console.error('Error creating post:', error);
  if(res.status(500)){
    if(error.code == 11000){
      req.flash("error" , "Account Already Registered with the Given Email"); 
    } else {
      req.flash("error" , "Phone Number Limit Exceeded"); 
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
        
        let newobj = {
          Model: posts.Model,
          Img: posts.Img,
          Description: Description,
          PostedAt: formatPostDateAgo(posts.PostedAt),
          Price: posts.Price,
          PID: postid[i],
        }; 
        postlist.push(newobj); 
      }
    }
    var user = ({
      Username: currentuser.Username,
      Email: currentuser.Email,
      Password: currentuser.Password,
      JoinedAt: dateParser(currentuser.JoinedAt),
      PhoneNumber : currentuser.PhoneNumber,
      ProfileImg: currentuser.ProfileImg,
    })

      res.render(path.join(__dirname,'./website/templates/profilePage.ejs'),{user:user, post:postlist});
    }catch(error){
    console.log(error);
    res.status(500).send('Internal Server Error');
  }
});

app.get('/profileview/:uid', async function (req,res){
  try{
    if (!req.cookies.auth) {
      res.redirect('/login');
      return;
    }

    var requser = await User.find({Cookie : req.cookies.auth});
    currentuser = requser[0];

    var curuser = ({
      ProfileImg: currentuser.ProfileImg,
      Username: currentuser.Username,
      });

    var userID = req.params.uid;
    console.log('-----------');
    console.log(userID);
    console.log('-----------');
    var Leaser = await User.findById(userID);
      
    var postid = Leaser.Posts;
    console.log(postid);
    var postlist = [];
    for (let i = 0; i < postid.length; i++) { 
      var posts = await Post.findById(postid[i]);
      if (posts) {

        //Description cut off at end for '...'
        var Desc1 = posts.Description;
        var Desc2 = Desc1.split(' ');
        var Description = Desc2.slice(0, 20).join(' ') + '...';
        
        let newobj = {
          Model: posts.Model,
          Img: posts.Img,
          Description: Description,
          PostedAt: formatPostDateAgo(posts.PostedAt),
          Price: posts.Price,
          PID: postid[i],
        }; 
        postlist.push(newobj); 
      }
    }
    var user = ({
      Username: Leaser.Username,
      Email: Leaser.Email,
      Password: Leaser.Password,
      JoinedAt: dateParser(Leaser.JoinedAt),
      PhoneNumber : Leaser.PhoneNumber,
      ProfileImg: Leaser.ProfileImg,
    })

      res.render(path.join(__dirname,'./website/templates/leaserProfile.ejs'),{user:user, post:postlist, curuser:curuser});
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
      res.render(path.join(__dirname,'./website/templates/createPost.ejs'),{user:user, messages:req.flash()});
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
    req.flash("Success" , "Post Created Successfully!");
    res.redirect('/home');

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

    //Getting Post data
    const postId = req.params.pid;
    const postList = await Post.findById(postId);

    // Leaser ID and information 
    const UID = postList.OwnerID;
    var requser = await User.find(UID);
    var Leaser = requser[0];

    //current user information for navbar
    var requser = await User.find({Cookie : req.cookies.auth});
    var currentuser = requser[0];
  
    var user = ({
      ProfileImg: currentuser.ProfileImg,
      Username: currentuser.Username,
      })
    

    const post={
      Username: Leaser.Username,
      UID : Leaser.id,
      Model: postList.Model,
      Condition: postList.Condition,
      Price: postList.Price,
      Description: postList.Description,
      Location: postList.Location,
      PostedAt: dateParser(postList.PostedAt),
      id : postId,
      Img: postList.Img,
    }

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

app.get('/', async function(req, res){
  res.render(path.join(__dirname, './website/templates/landingpage.ejs'));
});

app.listen(port, function(){
    console.log('Running server on port '+port);
});
