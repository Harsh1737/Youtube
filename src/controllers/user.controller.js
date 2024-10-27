import { asyncHandler } from '../utils/asyncHandler.js';

const registerUser = asyncHandler(async (req, res) => {
    // get the user data from the request body (frontend)
    // validate the user data
    // check if the user already exists in the database: username, email
    // check for images: profile picture, cover photo
    // upload the user image to the server, cloudinary, or s3 bucket
    // create User Object = create entry in the database
    // send the response back to the frontend after removing the sensitive data ( password, refresh token)
    // check for the errors
    // send the response back to the frontend
    const {fullName, email, username, password} = req.body;
    console.log(fullName, email, username, password);
});

export { registerUser };