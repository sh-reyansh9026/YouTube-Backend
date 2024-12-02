import mongoose, { Schema } from "mongoose"
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
        index:true // for searching index must be true for ease
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    fullName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        index:true // for searching index must be true for ease
    },
    avatar: {
        type: String, // cloudinary url
        required:true,
    },
    coverImage: {
        type:String, 
    },
    watchHistory: [{
        type: Schema.Types.ObjectId,
        ref:"Video"
    }],
    password: {
        type: String,
        required:[true,'Password is required']
    },
    refreshToken: {
        type:String
    }
},
    {
    timestamps:true
})
// pre is middleware which here specifies that do any work before saving "save" any data, here it is encrypting password on every saving of data
userSchema.pre("save", async function (next) {
    if (!this.isModified("password")) // here checking iff password is changed then only encrypt the password otherwise no need to chnage encryption on every time of saving
        return next();

    this.password = bcrypt.hash(this.password,10) // here 10 refers to round of hash function that how much rounds are to be used for encrypting
    next()
})

// password checking from database is correct or not
userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password) // returns true or false
}
// access token is used to authenticate and authorize api requests
userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this.id,
            email: this.email,
            username: this.username,
            fullName:this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
// refresh token is used to generate a new access token without requiring the user to log in again
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this.id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}
export const User = mongoose.model("User",userSchema)