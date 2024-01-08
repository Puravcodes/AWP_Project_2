const instance = require("../../models/instance");

module.exports = function(router){ 
    router.post('/users',function(req,res){
        var user = new instance();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        if (req.body.name == null|| req.body.name == ''|| req.body.username == null || req.body.username == ''|| req.body.password == null|| req.body.password == ''){
            res.send('Ensure username,name and password are provided');
        }else{
            if(user.err){
                res.send('Username already exists'+ user.err);
            }else{
                user.save();
                res.send('user created');
                //curl http://localhost:8080/api/users -X POST -H "Content-Type: application/json" --data '{"name":"Leroy", "username": "Leroy", "password": "Niggaman123"}'
            }
        }
    });
    return router;
} 