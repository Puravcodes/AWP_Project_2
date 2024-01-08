var mongoose = require('mongoose');
const schema = mongoose.Schema;
var bcrypt = require('bcrypt-nodejs');

var userSchema = new schema({
    name: {
        type:String,
        required:true
    },
    username: {
        type:String,
        required:true,
        unique:true
    },
    password: {
        type:String,
        required:true,
    }
});

//encrypting password before saving to database
userSchema.pre('save',function(){
    var user = this;
    bcrypt.hash(user.password,null,null,function(err,hash){
        if(err){
            return next(err);
        }
        user.password=hash;
    });
});


module.exports = mongoose.model('instance', userSchema);