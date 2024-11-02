import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

const generateAccessAndRefreshTokens = async(userId) =>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return {accessToken, refreshToken}


    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    // req.body => data
    // validate the data based on email / username
    // check if the user exists in the database
    // compare the password
    // generate the access token and refresh token
    // send the response back to the frontend in secured cookies
    // check for the errors

    const {email,username, password} = req.body;
    if ( !username && !email ) throw new ApiError(400, "Please provide email or username"); // (!(username || email))
    if ( !password ) throw new ApiError(400, "Please provide password");

    const user =  await User.findOne({$or: [{email}, {username}]})
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.verifyPassword(password);
    if (!isPasswordCorrect) throw new ApiError(401, "Invalid credentials");


    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // User.findById(user._id).updateOne({refreshToken}); // update the refreshToken in the database for the user
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(new ApiResponse(200, "User logged in successfully", {user :{loggedinUser,accessToken, refreshToken}}));
});

const logoutUser = asyncHandler(async (req, res) => {
    // clear the cookies
    // update the refreshToken in the database
    // send the response back to the frontend
    
    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {refreshToken: undefined}
        },
    );
    if (!user) throw new ApiError(404, "User not found");
    const options = {
        httpOnly: true,
        secure: true
    }
    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
    // get refresh token from cookie or header
    // if didnt find refresh token, throw an error
    // If found the refresh token, verify the token
    // get the user from the database
    // generate the new access token
    // send the response back to the frontend
    // check for the errors
    const inComingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    try {
        if (!inComingRefreshToken) throw new ApiError(400, "Please provide refresh token");
    
        const decoded = jwt.verify(inComingRefreshToken, process.env.JWT_SECRET)
        
        const user = await User.findById(decoded?._id)
        if (!user) throw new ApiError(404, "User not found");
    
        if ( inComingRefreshToken !== user.refreshToken) throw new ApiError(401, "Invalid refresh token");
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(new ApiResponse(200, "Access token refreshed successfully", {accessToken, refreshToken: newRefreshToken}));
    } catch (error) {
        throw new ApiError(401, "Invalid refresh token");
    }
});

const ChangePassword = asyncHandler( async( req,res ) =>{

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) throw new ApiError(400, "Please provide old password and new password");

    const user = await User.findById(req.user?._id);
    if (!user) throw new ApiError(404, "User not found");

    const isPasswordCorrect = await user.verifyPassword(oldPassword);
    if (!isPasswordCorrect) throw new ApiError(401, "Invalid credentials");

    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    return res
    .status(200)
    .json(new ApiResponse(200, "Password changed successfully"));
})

const getUserProfile = asyncHandler( async(req,res)=>{

    const user = await User.findById(req.user?._id).select("-password -refreshToken");
    if (!user) throw new ApiError(404, "User not found");

    return res
    .status(200)
    .json(new ApiResponse(200, "User profile", user));
})

const updateUserProfile = asyncHandler( async(req,res)=>{
    const {fullname, email} = req.body;
    if ( [fullname, email].some((field) => field === undefined || field.trim() === "") ) {
        throw new ApiError(400, "All fields are required");
    }
    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {fullname, email}
    }, {new: true, runValidators: true}).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res
    .status(200)
    .json(new ApiResponse(200, "User profile updated successfully", user));
});

const updateUserAvatar = asyncHandler(async (req, res) => {

    const avatarLocalPath = req.file?.avatar[0]?.path?;
    if (!avatarLocalPath) throw new ApiError(400, "Please provide avatar image");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // ( !avatar.url)
    if (!avatar) throw new ApiError(500, "Failed to upload images");

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {avatar: avatar.url}
    }, {new: true, runValidators: true}).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res
    .status(200)
    .json(new ApiResponse(200, "User avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.coverImage[0]?.path;
    if (!coverImageLocalPath) throw new ApiError(400, "Please provide cover image");

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!coverImage) throw new ApiError(500, "Failed to upload images");

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {coverImage: coverImage.url}
    }, {new: true, runValidators: true}).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");
    
    return res
    .status(200)
    .json(new ApiResponse(200, "User cover image updated successfully", user));
});

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    ChangePassword,
    getUserProfile,
    updateUserAvatar,
    updateUserCoverImage,
};