import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
      destination:(req, file, callback) => {
        console.log(req.body.user_id);
        let tourpathlarge =  "user-"+req.body.user_id +"/tour-"+req.body.tour_id+"/thumbnail/";
        const fs = require('fs');
        const imagePath = path.resolve(__dirname, '../../../images/tours/'+tourpathlarge);
        if (!fs.existsSync(imagePath)){
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
      },
      filename: (req, file, cb) => {
          cb(null, `thumbnail-${Date.now()}.jpg`);
      },
  });
  

export const uploadThumbnail:any = multer({
  storage: storageEngine,
});
