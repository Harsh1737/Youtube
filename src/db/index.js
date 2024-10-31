import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connectDB = async() => {
    try{
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
        // console.log(connectionInstance);
        console.log(`\n Connected to MongoDB!! DB HOST : ${connectionInstance.connection.host} \n`);
    }catch(error){
        console.log("Error in connection  : ", error);
        throw error;
    }
}

export default connectDB;










// in main index.js file
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



// Process.exit(1) will exit the process with a failure code.
// Process is process object that is a global that provides information about, and control over, the current Node.js process.

// connection INstance is the (response) object that is returned by the mongoose.connect method
// connectionInstance.connection.host will give the host of the database that we are connected to
// connectionInstance.connection.port will give the port of the database that we are connected to
//represents the established connection between your Node.js application and the MongoDB database using Mongoose.It holds information and methods that allow you to interact with the database throughout your application.