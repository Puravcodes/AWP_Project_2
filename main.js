var express = require('express');
var app = express();
var port = process.env.PORT||8080;
var morgan = require('morgan');
var mongoose = require('mongoose');
var router = express.Router();
var path = require('path');


app.use(morgan('dev')); // logs request in terminal
app.use(express.json()); 
app.use(express.urlencoded({ extended: true })); // decodes json data to text 
app.use(express.static(path.join(__dirname + '/website/templates')));

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


app.listen(port, function(){
    console.log('Running server on port '+port);
});