
var express = require('express');
var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
const session = require('express-session');
var sqlite3 = require('sqlite3').verbose();

var logged_users = new Array();

app.use(express.urlencoded({extended:true}));
app.use(session({secret:'lyanna be lajjay',resave:true,saveUninitialized:true}));
const port  = 3000;//setport as 3000

const db = new sqlite3.Database('./dbs/content.db',(err)=>{
    if(err){
        console.error(err.message);
    }
    console.log("Connected to my Database!");
});

db.run("create table if not exists users(username text,email text,password text)");
db.run("create table if not exists messages(title text,content text,fom text,tos text)");

//processing get request

app.get('/',(req,res)=>{
    if(req.session.user){
        res.sendFile(__dirname+"/public/index.html");
    }else{
        return res.redirect('/login');
    }
});

app.get('/login',(req,res)=>{
    res.sendFile(__dirname+"/public/login.html");
});

app.get('/register',(req,res)=>{
    res.sendFile(__dirname+"/public/register.html");
});

//processing post requests.

app.post('/login',function(req,res){
    var user = req.body.usern;
    var pwd = req.body.pwdn;
    db.get("select * from users where username = ?",[user],(err,row)=>{
        if(err) {
            return console.error(err.message);
        }
        if(row){
            console.log(row.email);
            if(row.password == pwd){
                var ses = req.session;
                ses.user = row.username;
                ses.mail = row.email;
                return res.redirect('/');
            }else{
                console.log("passwords are not match");
                return res.redirect('/login');
            }
        }else{
            console.log("Could not find user!");
            return res.redirect('/login');
        }
    });
});

app.post('/register',function(req,res){
    var usr = req.body.uname;
    var mail = req.body.uemail;
    var pwd1 = req.body.upwd1;
    var pwd2 = req.body.upwd2;
    if(pwd1 == pwd2){
        db.run('insert into users (username,email,password)values(?,?,?)',[usr,mail,pwd1],function(err){
            if(err){
                return console.log(err.message);
            }else{
                console.log("a row has been inserted!");
                var ses = req.session;
                ses.user = usr;
                ses.mail = mail;
                console.log('session created!');
                return res.redirect('/');
            }
        })
    }else{
        console.log("passwords not match!");
        return res.redirect('/register');
    }
});

io.on('connection',(socket)=>{
    console.log('user connected!');
    socket.on('message',(content)=>{
        io.emit('message',content);
    });
    socket.on('disconnect',()=>{
        console.log('A user disconnected!');
    });
})

//listening app
http.listen(port,(err)=>{
    if(err)throw err;
    console.log("Server Started!");
});
