"use strict";

let mongo = require('mongodb');
let client = mongo.MongoClient;
let _db;

module.exports = {
  connect() {
  var mongoUrl = 'mongodb://localhost:27017/construapp';
   mongoUrl = 'mongodb://user:pass@ds019063.mlab.com:19063/heroku_gkbdfwlb';
  if(process.env.NODE_ENV == 'production'){
    mongoUrl = 'mongodb://user:pass@ds019063.mlab.com:19063/heroku_gkbdfwlb';
  }
  
  client.connect(mongoUrl, (err, db) => {
      if(err) {
        console.log("Error connecting to Mongo - check mongod connection");
        process.exit(1);
      }
      _db = db;
      console.log("Connected to Mongo");
    });
  },
  sports(){
    return _db.collection('sports');
  },
  users(){
    return _db.collection('users');
  }
}
