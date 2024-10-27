import multer from 'multer';

const storage = multer.diskStorage({
    destination: (req, file, cb) => {   // file - gives access to file
        cb(null, "public/temp");
    },
    filenamme: function(req,file,cb){
        cb(null, file.originalname)
    }
});

export const upload = multer({
    storage,
})