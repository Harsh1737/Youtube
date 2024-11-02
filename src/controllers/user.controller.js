import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';
import mongoose from 'mongoose';

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
            $unset: {refreshToken: 1} // this will remove the refreshToken from the database
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
    if (!inComingRefreshToken) throw new ApiError(400, "Please provide refresh token");
    try {
    
        const decoded = jwt.verify(inComingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decoded?._id)
        if (!user) throw new ApiError(404, "User not found");
        if ( inComingRefreshToken !== user?.refreshToken) throw new ApiError(401, "Invalid refresh token");
    
        const options = {
            httpOnly: true,
            secure: true,
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(new ApiResponse(200, "Access token refreshed successfully", {accessToken, refreshToken: newRefreshToken}));
    } catch (error) {
        throw new ApiError(401, "Error in refreshing token");
    }
});

const changePassword = asyncHandler( async( req,res ) =>{

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

    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) throw new ApiError(400, "Please provide avatar image");

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    // ( !avatar.url)
    if (!avatar) throw new ApiError(500, "Failed to upload images");

    // TODO: delete the old avatar from cloudinary

    const user = await User.findByIdAndUpdate(req.user?._id, {
        $set: {avatar: avatar.url}
    }, {new: true, runValidators: true}).select("-password -refreshToken");

    if (!user) throw new ApiError(404, "User not found");

    return res
    .status(200)
    .json(new ApiResponse(200, "User avatar updated successfully", user));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;
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

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) throw new ApiError(400, "Please provide username");

    const channel = await User.aggregate([
        {
            $match: {
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscredTo"
            }
        },
        {
            $addFields: {
                subscriberCount: {$size: "$subscribers"},
                subscribedToCount: {$size: "$subscredTo"},
                isSubscribed:{
                    $cond: {if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullname: 1,
                username: 1,
                subscriberCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])
    // console.log(channel);
    if (!channel?.length) throw new ApiError(404, "Channel not found");

    return res
    .status(200)
    .json( new ApiResponse(200, "Channel profile", channel[0]));
});

const getWatchHistory = asyncHandler(async (req, res) => {
    // const user = req.user._id;
    // In this case mongoose will automatically convert the string to ObjectId and then compare
    // But in case of aggregate we have to convert the string to ObjectId

    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory.video",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullname: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        },
                    },
                    {
                        $addFields: {
                            owner: { $first: "$owner" }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, "Watch history", user[0].watchHistory));
});

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getUserProfile,
    updateUserProfile,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
};