import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
    console.log("email", email);

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
    const existedUser = User.findOne({
        $or: [{ username }, { email }] // this $or:[] is used to check condition for or operator btw different array elements
    })
    if (existedUser) { //checking condition if existedUser returns true 
        throw new ApiError(409, "User with email or username already exists")
    }

    // 4.check for images, check for avatar
    // generally we get va;ues using req.body but we have made middleware also so middleware basically adds more values to req.body so we use req.files instead of req.body here when middleware is used
    const avatarLocalPath = req.files?.avatar[0]?.path; // .avatar bcoz avatar is defined previously
    const coverImageLocalPath = req.files?.coverImage[0]?.path; // .coverImage bcoz coverImage is defined previously

    if (!avatarLocalPath) {// coverImage is not compulsory so it is not checked
        throw new Error(400, "Avatar file is required");
    }

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

export {registerUser}