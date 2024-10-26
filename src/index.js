// require("dotenv").config( {path:'./env'} );
// Takes a object as an argument, and the object has a key called path, and the value of the key is the path of the .env file

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config( {path:'./.env'} );

connectDB()
.then( ()=>{
    app.on("error", (error) => {
        console.log("Error : ", error);
        throw error;
    });
    app.listen( process.env.PORT || 8000, () => {
        console.log(`Server running on port ${process.env.PORT}`);
    }) 
})
.catch( (error) => console.log(error) );