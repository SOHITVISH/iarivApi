import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
    destination: (req, file, callback) => {
        const fs = require('fs');
        let tourpathlarge =  "user-"+req.body.user_id +"/profile-pic/";
        const imagePath = path.resolve(__dirname, '../../../images/tours/'+tourpathlarge);
        if (!fs.existsSync(imagePath)) {
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
    },
    filename: (req, file, cb) => {
        cb(null, `prifile-${Date.now()}.jpg`);
    },
});


export const uploadProfilePic: any = multer({
    storage: storageEngine,
});
