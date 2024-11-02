import mongoose, { Schema } from 'mongoose';
import jwt from 'jsonwebtoken'; // it is a bearer token that is used to authenticate the user.
import bcrypt from 'bcrypt'; // it is used to verify and hash the password before storing it in the database.
const userSchema = new Schema(
    {
        username : {
            type : String,
            required : true,
            unique : true,
            lowercase : true,
            trim : true,
            minlength : 3,
            index : true
        },
        email:{
            type : String,
            required : true,
            unique : true,
            trim : true,
            lowercase : true,
        },
        fullname :{
            type : String,
            required : true,
            trim : true,
            index : true
        },
        avatar :{
            type : String,
            required : true,
        },
        coverImage :{
            type : String,
        },
        watchHistory :[
        {
            type : Schema.Types.ObjectId,
            ref : "Video"
        }
        ],
        password :{
            type : String,
            required : [true, 'Password is required'],
            minlength : 6
        },
        refreshToken: {
            type: String,
        },
    },
    {
        timestamps : true
    }
);

userSchema.pre('save', async function(next){
    // pre-save hook to hash the password before saving the user to the database.
    // function but not  () => {} because we need to access the user object (current user) (this).
    // this refers to the current user object.
    // async function because it involves an asynchronous operation (hashing the password).
    // next is a callback function that we call to move to the next middleware in the middleware stack.
    if(!this.isModified('password')){
        next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt); // hash the password with the salt and store it in the password field.
        next();
    } catch (error) {
        next(error);
    }
});

userSchema.methods.verifyPassword = async function(password){
    return await bcrypt.compare(password, this.password); 
    // compare the password entered by the user with the hashed password stored in the database.
    // return a boolean value indicating whether the passwords match.
    // await because bcrypt.compare is an asynchronous operation.
};

userSchema.methods.generateAccessToken = function(){
    // generate an access token for the user.
    // return the token.
    // not an async function because jwt.sign is synchronous.
    return jwt.sign(
        { 
            _id : this._id,
            email : this.email,
            username : this.username,
            fullname : this.fullname,
        }, // payload
        process.env.ACCESS_TOKEN_SECRET, // secret key
        { expiresIn : process.env.ACCESS_TOKEN_EXPIRY } // token expiry time
    );
}

userSchema.methods.generateRefreshToken = function(){
    // generate a refresh token for the user.
    // return the token.
    // not an async function because jwt.sign is synchronous.
    return jwt.sign(
        {
            _id : this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        { expiresIn : process.env.REFRESH_TOKEN_EXPIRY }
    )
}

const User = mongoose.model('User', userSchema);

export { User };