"use strict";

var cloudinary = require('cloudinary')  
  , fs = require('fs')
  
cloudinary.config({ 
  cloud_name: 'construapp', 
  api_key: '162427192678176', 
  api_secret: 'u-1b774wGBa4lBFaD_Ov1pCBtvM' 
});

module.exports = {  
  upload(path, public_id, callback) {
    if(public_id != 'undefined') {
      cloudinary.uploader.upload(path, function(result) {
        return callback(result);
      },
      { public_id: public_id, invalidate: true });
    }
    else{
      cloudinary.uploader.upload(path, function(result) {
        return callback(result);
      });
    }
  }
};