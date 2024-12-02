import multer from "multer";

const storage = multer.diskStorage({ // cb is callback
  destination: function (req, file, cb) { // multer is basically used for uploading of files as video,json,images we have already configured with express before but file can't be
    cb(null, "./public/temp")
  },
  filename: function (req, file, cb) {
    
    cb(null, file.originalname)
  }
})

export const upload = multer({ storage, })  