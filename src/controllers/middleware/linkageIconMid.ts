import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
    destination:(req, file, callback) => {
        const fs = require('fs');
        let tourpathlarge =  "user-"+req.body.user_id +"/tour-"+req.body.tour_id+"/linkages/";
        const imagePath = path.resolve(__dirname, '../../../images/tours/'+tourpathlarge);
        if (!fs.existsSync(imagePath)){
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
      },
    filename: (req, file, cb) => {
        console.log(file);
        cb(null, `linkage-${Date.now()}.jpg`);
    },
  });
  

export const uploadLinkageIcon:any = multer({
  storage: storageEngine,
});
