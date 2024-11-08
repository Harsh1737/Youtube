import multer from "multer";
// console.log(multer.diskStorage);
// console.log(multer().file);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {   // file - gives access to file
        cb(null, "./public/temp");
    },
    filename: function(_,file,cb){
        const originalName = file.originalname;
        cb(null, originalName);
    }
});

export const upload = multer({
    storage,
})