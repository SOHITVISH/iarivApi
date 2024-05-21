import multer from "multer";
import path from "path";


//Setting storage engine
const storageEngine = multer.diskStorage({
  destination: (req, file, callback) => {
    console.log(req.body.user_id);
    let tourpathlarge = "user-" + req.body.user_id + "/tour-" + req.body.tour_id + "/scene-" + req.body.scene_id + "/speech/";
    const fs = require('fs');
    const imagePath = path.resolve(__dirname, '../../../images/tours/' + tourpathlarge);
    if (!fs.existsSync(imagePath)) {
      fs.mkdirSync(imagePath, { recursive: true });
    }
    callback(null, imagePath);
  },
  filename: (req, file, cb) => {
    const fileExt = file.originalname.split('.')[1];
    cb(null, `speech-${Date.now()}.${fileExt}`);
  },
});

const checkFileType  = async (file:any, cb:any) =>  {
  // Check mime
  const mimetype = file.mimetype;
  if (mimetype === "audio/mpeg") {
    return cb(null, true);
  } else {
    return cb("Error: Audio Only!");
  }
}


export const avatarSpeechAudio: any = multer({
  storage: storageEngine,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  },
});
