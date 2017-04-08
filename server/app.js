"use strict";

let express = require("express");
let app = express();

var multer  = require('multer');
var upload = multer({ storage: multer.memoryStorage() });
var Datauri = require('datauri');
let uploadFile = require('./uploadFile');

let mongoUtil = require('./mongoUtil');
mongoUtil.connect();

app.use(express.static(__dirname + "/../client") );

let bodyParser = require("body-parser");
let jsonParser = bodyParser.json();

app.get("/sports", (request, response) => {
  let sports = mongoUtil.sports();
  sports.find().toArray((err,docs) => {
    if(err) {
      response.sendStatus(400);
    }
    let sportNames = docs.map((sport) => sport.name);
    response.json( sportNames );
  });
});

app.get("/sports/:name", (request, response) => {
  let sportName = request.params.name;

  let sports = mongoUtil.sports();
  sports.find({name: sportName}).limit(1).next((err,doc) => {
    if(err) {
      response.sendStatus(400);
    }d
    response.json(doc);
  });

});


app.post("/sports/:name/medals", jsonParser, (request, response) => {
  let sportName = request.params.name;
  let newMedal = request.body.medal || {};

  if(!newMedal.division || !newMedal.year || !newMedal.country){
    response.sendStatus(400);
  }

  let sports = mongoUtil.sports();
  let query = {name: sportName};
  let update = {$push: {goldMedals: newMedal}};

  sports.findOneAndUpdate(query, update, (err, res) => {
    if(err){
      response.sendStatus(400);
    }
    response.sendStatus(201);
  });
});

app.post("/authenticate", jsonParser, (request, response) => {
  
  let user = request.body.user;

  if(!user.username || !user.password){
    response.sendStatus(400);
  }

   let users = mongoUtil.users();
   let query = {username: user.username, password: user.password};

    users.find(query).limit(1).next((err,doc) => {    
   
    if(err) {
      response.sendStatus(400);
    }  
    else if(!doc){
      response.json({
        invalid: true
      });
    }
    else
      response.json(doc);
  }); 
});

app.post("/createUser", jsonParser, upload.single('file'), (request, response) => {
  
  let user = request.body;
  console.log(request.body);
  if(!user.name || !user.username || !user.password || !user.email) {
    response.sendStatus(400);
  }
  else
  {
    //upload images
    var dUri = new Datauri();
    dUri.format(request.file.originalname,request.file.buffer);
    uploadFile.upload(dUri.content, request.body.public_id, function(result) {
        if(result.error) { console.log('error upload image'); response.sendStatus(500); }
        else {
          //mongo save
          let users = mongoUtil.users();
          let query = { username: user.username };
          let update = { name: user.name, username: user.username, password: user.password, 
            email: user.email, registeredname: user.registeredname, fantasyname: user.fantasyname,
            phones: user.phones};

          users.findOneAndUpdate(query, update, {upsert:true}, (err, res) => {
            if(err){
              response.sendStatus(500);
            }
            else{
              response.sendStatus(201);
            }
          });
        }
    });
  }
});

app.post('/uploadImage', upload.single('file'), function(req, res){
  var dUri = new Datauri();
  dUri.format(req.file.originalname,req.file.buffer);
    uploadFile.upload(dUri.content, req.body.public_id, function(result){
      console.log(result);
      if(result.error) res.sendStatus(500);
      else res.json(result);
    });
});

app.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, app.settings.env);
});
