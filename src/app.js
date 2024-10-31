import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
// console.log(express);
// console.log(cookieParser);
// console.log(cors);
// console.log(app);
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
}));
// data can come from url, forms, json format, cookie, params.
// use is used for middleware, configuration of the app.

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));  // public folder ( on our server) is accessible to the client.
app.use(cookieParser());


// routes import
import userRouter from "./routes/user.routes.js";

// routes declaration
app.use("/api/v1/users", userRouter);

export default app;


// express() is a function that creates an instance of an Express application.
// This instance is used to configure the application and start the server.

// request ---> baseUrl, body (forms, json format data), cookie, hostname, ip, params.
// cookie ---> stored in the browser, can be accessed by the server.
// response