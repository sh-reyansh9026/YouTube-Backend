import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

// generating access and refresh token method to use in login
const generateAccessAndRefreshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // here we have generated access and refresh tokens but we have to save it in db as we give refresh token to user for login after timeout
        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false }) // saving in db and on every save db requires password for validation but here we want to save it so no need of password that's why we have given false value to validation
    
        return { accessToken, refreshToken }
    }
    catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")
    }
}

//                registering user
const registerUser = asyncHandler(async (req, res) => {
    // we have to register user
    // steps!!
    // 1.get user details from frontend
    // 2.validate -- not empty
    // 3.check if user already exists: username,email
    // 4.check for images, check for avatar
    // 5.upload them to cloudinary, avatar
    // 6.create user object - create entry in db
    // 7.remove password and refresh token field from response bcoz from db as it is along with password and token response comes
    // 8.check for user creation
    // 9. return response

    // 1.get user details from frontend
    const { fullName, email, username, password } = req.body
    // console.log("email", email);

    // 2.validate -- not empty
    // if (fullName === "") {// either check one by one like this or make an array
    //     throw new ApiError(400, "fullname is required")
    // }

    // array
    if ([fullName, email, username, password].some((field) =>
        field?.trim() === "")) // some function returns true if any of the field or array elements met the condition here it check after trimming white spaces if any array field is empty i.e ""
    {
        throw new ApiError(400, "All fields are required")
    }

    // 3.check if user already exists: username,email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }] // this $or:[] is used to check condition for or operator btw different array elements
    })
    if (existedUser) { //checking condition if existedUser returns true 
        throw new ApiError(409, "User with email or username already exists")
    }

    // 4.check for images, check for avatar
    // generally we get values using req.body but we have made middleware also so middleware basically adds more values to req.body so we use req.files instead of req.body here when middleware is used
    const avatarLocalPath = req.files?.avatar[0]?.path; // .avatar bcoz avatar is defined previously
    // const coverImageLocalPath = req.files?.coverImage[0]?.path; // .coverImage bcoz coverImage is defined previously
    let coverImageLocalPath;
    if (req.files && Array.isArray(req.files?.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    if (!avatarLocalPath) {// coverImage is not compulsory so it is not checked
        throw new Error(400, "Avatar file is required");
    }
    // console.log(req.files);
    
    // 5.upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath) // it takes time to upload so await is used
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)


    // checking avatar is there or not again bcoz it is compulsory
    if (!avatar) {
        throw new Error(400, "Avatar file is required");
    }
    // 6.create user object - create entry in db
    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",// if coverImage is there then make entry of it in db otherwise not
        email,
        password,
        username: username.toLowerCase()
    })

    // 7.remove password and refresh token field from response bcoz from db as it is along with password and token response comes
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken" //.select method by default selects all so we have to give which we do not need to select
    ) // in db for every field db itself create a _id field so have used it here to check if entry has been created or not
   
    // 8.check for user creation
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering user")
    }

    // 9. return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

//                   login user          
const loginUser = asyncHandler(async (req, res) => {
    //          steps
    // 1.get user credentials from req.body /from frontend
    // 2.get username or email
    // 3.find the user in db
    // 4.if found then check password
    // 5.give access and refresh token to user
    // 6.send it to cookies securely
    // 7.return response that user logged in successfuly

     // 1.get user credentials from req.body /from frontend
    const { email, username, password } = req.body
    console.log(email);
    
    // 2.get username or email
    if (!(username || email)) {
        throw new ApiError(400, "username or email is required");
    }

    // 3.find the user in db
    const user = await User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(400, "User does not exist");
    }

    // 4.if found then check password
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials");
    }

    // 5.give access and refresh token to user
    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)
    
    // 6.send it to cookies securely
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
    // cookies
    const options = { // by enabling them to true cookies cannot be modiefies at frontend
        httpOnly: true,
        secure : true
    }

    // 7.return response that user logged in successfuly
    return res.status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(// here we are sending json response also as we have already saved it to cookies bcoz may be user wants to save cookies to local storage also that's why
            new ApiResponse(
                200,
                {
                    user: loggedInUser,accessToken,refreshToken
                },
                "User logged in successfully"
        )
    )
})

//                   logout user
const logoutUser = asyncHandler(async (req, res) => {
    // this method is accessed after /logout route in user.route then middleware that is verify JWT then logoutUser so from verifyJWT we get access of req.user
    await User.findByIdAndUpdate(req.user._id, {// this parameter is for what to update
        $set: {
            refreshToken: undefined // updated
        }
    },
        {
            new : true // new updated value in return response
        }
    )

    // cookies
    const options = { // by enabling them to true cookies cannot be modiefies at frontend
        httpOnly: true,
        secure : true
    }

    return res.status(200)
        .clearCookie("accessToken", options)
        .clearCookie("refreshToken", options)
        .json(new ApiResponse(200, {}, "User logged out"))
    
})

// accessToken is short lived while refreshToken is long lived
// suppose accessToken has life 15 minutes and refreshToken has life 7 days
// so after every 15 minutes user gets loggedOut so to remain user loggedIn there is 401 request to frontend telling that accessToken expired
// so frontend hits and endpoint which has code to send refreshToken to backend and it will be checked in db that it is same as refreshToken stored in db if yes then it will get new accessToken and user will be loggedIn
// it can be done for 7 days as maximum as it is the life of refreshToken it's an example

// code of controller of endpoint that frontend hits when accessToken is required is given below
// endpoint is called in user.routes
const refreshAccessToken = asyncHandler(async (req, res) => {
    // we have to send refreshToken , it can be taken from cookies or from body if accessed from mobile phones
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
    if (!incomingRefreshToken) {
        throw new ApiError(401,"unauthorized request")
    }

   try {
     // if refreshToken is coming then verify it that it is actually in the format of  token or not
     const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
     // refreshToken has _id as we have only one thing that is _id so it is decoded so we get access of_id and from _id we get access of user and info about it
     const user = await User.findById(decodedToken?._id)
     // if user is not there
     if (!user) {
         throw new ApiError(401,"Invalid refresh token")
     }
     // if user is there then we have to check that is it same as refreshToken stored in db
     // if incoming refresh token doesn't match with refresh token in db
     if (incomingRefreshToken !== user?.refreshToken) {
         throw new ApiError(401,"Refresh Token is expired or used")
     }
     // if incoming refresh token matches with refresh token in db
     // generate new access token using generateAccessAndRefreshTokens defined above in this file only
     // for generation it must be sent to cookies so options is to be made
     const options = {
         httpOnly: true,
         secure: true
     }
     const { accessToken,newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
     return res.status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", newRefreshToken, options)
         .json(new ApiResponse(200,
             { accessToken, refreshToken: newRefreshToken },
             "Access token refreshed")
         )
   } catch (error) {
       throw new ApiError(401, error?.message || "Invalid refresh token")
   }
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
}