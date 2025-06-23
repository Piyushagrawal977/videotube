import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import validator from "validator"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js"


const registerUser=asyncHandler(async (req,res)=>{

    // res.status(200).json({
    //     message:"ok"
    // }) 

    // get data from the frontend
    // validate the data 
    // check if the user existed or not
    // collect the image, avtar and coverImage
    // upload to cloudinary, avtar and coverImage
    // create the user 
    // make a entry on db
    // remove password and refresh token from resp
    // return response

    const {fullName,email,password,userName}=req.body;

    if(
        [fullName,email,password,userName].some((field)=>field===undefined)
    )
    {
        throw new ApiError(400,"All fields are required")
    }

    console.log("password",password)
    if(
        [fullName,email,password,userName].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(422,"All fields must be filed")
    }

    if(!validator.isEmail(email))
    {
        throw new ApiError(422,"Invalid Email Id")
    }

    
    const existedUser= await User.findOne(
        {
            $or: [{userName},{email}]
        }
    )
    console.log("existedUser",existedUser)

    if(existedUser){
        throw new ApiError(409,"User with the given email or username already exists")
       
    }

    
    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // const  coverImageLocalPath=req.files?.coverImage[0]?.path;

    console.log("req files",req.files);
    let avatarLocalPath,coverImageLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0)
    {
        avatarLocalPath=req.files.avatar[0].path
    }

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    console.log("avatarLocalPath",avatarLocalPath)
    if(!avatarLocalPath)
    {
        throw new ApiError(400,"Avatar file is required")
    }

    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {{
        throw new ApiError(400,"Avatar file is required")
    }
}

    const user = await User.create({
        userName:userName.toLowerCase(),
        fullName,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password


    })

    const createdUser= await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser)
    {
        throw new ApiError(500,"Something went wrong while registrating user")
    }

    return res.status(201).json(
        new ApiResponse(createdUser,200,"User Registered Successfully")
    )
    


})

export {registerUser};