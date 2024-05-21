import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
    destination: (req, file, callback) => {
        const fs = require('fs');
        const imagePath = path.resolve(__dirname, '../../../images/infospot-icons/');
        if (!fs.existsSync(imagePath)) {
            fs.mkdirSync(imagePath, { recursive: true });
        }
        callback(null, imagePath);
    },
    filename: (req, file, cb) => {
        const fileExt = file.originalname.split('.')[1];
        cb(null, `infospot-icon-${Date.now()}.${fileExt}`);
    },
});


export const adminInfospotIcon: any = multer({
    storage: storageEngine,
});
