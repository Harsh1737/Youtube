// require("dotenv").config( {path:'./env'} );
// Takes a object as an argument, and the object has a key called path, and the value of the key is the path of the .env file

import dotenv from "dotenv";
import connectDB from "./db/index.js";

dotenv.config( {path:'./.env'} );
connectDB();
