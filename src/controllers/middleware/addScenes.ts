import express from "express";
import multer from "multer";
import path from "path";
const app = express();


//Setting storage engine
const storageEngine = multer.diskStorage({
    destination:(req, file, callback) => {
        console.log(req.body.user_id);
        let tourpathlarge =  "user-"+req.body.user_id +"/tour-"+req.body.tour_id+"/scenes/larges/";
        const fs = require('fs');
        const imagePath = path.resolve(__dirname, '../../../images/tours/'+tourpathlarge);
        if (!fs.existsSync(imagePath)){
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
      },
    filename: (req, file, cb) => {
        cb(null, `original-${Date.now()}.jpg`);
    },
  });

export const addScenes:any = multer({
  storage: storageEngine,
  limits: {
    files: 10,
  },
});
