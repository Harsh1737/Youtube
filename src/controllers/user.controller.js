import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { User } from '../models/user.model.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from '../utils/ApiResponse.js';

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
    const {fullname, email, username, password} = req.body;
    // console.log(fullname, email, username, password);

    if ( [fullname, email, username, password].some((field) => field === undefined || field.trim() === "") ) {
        throw new ApiError(400, "All fields are required");
    }
    const existedUser = await User.findOne({
        $or: [{email}, {username}]
    })
    
    if (existedUser) {
        throw new ApiError(409, "User already exists");
    }
    // console.log(req.files);
    
    const avatarLocalPath = req.files?.avatar[0]?.path; 
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if ( !avatarLocalPath ) {
        throw new ApiError(400, "Please provide avatar image");
    }   
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    console.table([avatar]);
    if (!avatar) {
        throw new ApiError(500, "Failed to upload images");
    }

    const user = await User.create({
        fullname,
        email,
        username : username.toLowerCase(),
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })

    const createduser = await User.findById(user._id).select("-password -refreshToken");

    if (!createduser) {
        throw new ApiError(500, "Failed to create user");
    }

    return res.status(201).json(
        new ApiResponse(201, "User created successfully", createduser));
});

export { registerUser };