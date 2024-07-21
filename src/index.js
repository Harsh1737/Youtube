// require("dotenv").config( {path:'./env'} );
// Takes a object as an argument, and the object has a key called path, and the value of the key is the path of the .env file

import dotenv from "dotenv";

import mongoose, { connect } from "mongoose";
import { DB_NAME } from "./constants.js";
import connectDB from "./db/index.js";

dotenv.config({ path: "./env" });
connectDB();




























/*
import express from "express";
const app = express();
// needed to import this to attact listener to database connection
// Connect to MongoDB = iffy
// ; for safety, cleaning up any previous code
(async () => {
    try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on("error", (error) => {
        console.log("Error : ", error);
        throw error;
    });
    app.listen(process.env.PORT, () => {
        console.log("Server is running on port : ", process.env.PORT);
    });
    } catch (error) {
    console.log("Error : ", error);
    throw error;
    }
})();
*/