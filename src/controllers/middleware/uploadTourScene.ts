import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
    // destination: "./images/tours/65f14113eee8b5dc7ee1f65d/",
    destination:(req, file, callback) => {
        const fs = require('fs');
        let tourpath =  "user-"+req.body.user_id +"/tour-"+req.body.tour_id+"/scenes/larges/";
        const imagePath = path.resolve(__dirname, '../../../images/tours/'+tourpath);
        if (!fs.existsSync(imagePath)){
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
      },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, `original-${Date.now()}.jpg`);
    },
  });
  

export const uploadTourScene:any = multer({
  storage: storageEngine,
  limits:{
    files: 5,
  },
});
