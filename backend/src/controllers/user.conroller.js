import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import validator from "validator"
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken"

const options={
        httpOnly:true,
        secure:true
    }

const generateAccessAndRefreshToken=async(userId)=>{
   try {
    const user= await User.findById(userId);
     const accessToken= await user.generateAccessToken()
     const refreshToken =await  user.generateRefreshToken()

  
 
     user.refreshToken=refreshToken      // saving refresh token on backend
     await user.save({validateBeforeSave:false})   
 
     return {accessToken,refreshToken}
   } catch (error) {
        throw new ApiError(500,error||"Error Generating refresh and access Token")
   }
}

const registerUser=asyncHandler(async (req,res)=>{


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

    if(
        [fullName,email,password,userName].some((field)=>field?.trim() === "")
    ){
        throw new ApiError(422,"All fields must be filled")
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

   
    if(existedUser){
        throw new ApiError(409,"User with the given email or username already exists")
       
    }

    
    // const avatarLocalPath=req.files?.avatar[0]?.path;
    // const  coverImageLocalPath=req.files?.coverImage[0]?.path;

    
    let avatarLocalPath,coverImageLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length>0)
    {
        avatarLocalPath=req.files.avatar[0].path
    }

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
    {
        coverImageLocalPath=req.files.coverImage[0].path
    }

    
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
        new ApiResponse(200,createdUser,"User Registered Successfully")
    )
    


})

const logInUser=asyncHandler(async(req,res)=>{
    // take the username or email id from the user
    // validate the username or email if it exist or not
    // take the password from user
    // validate the password.
    // generate the access and refresh token
    // store the token into the cookies

   const {userName,email,password}=req.body;

   if(!userName && !email)
   {
        throw new ApiError(404,"No Username or Email found")
   }

   const existedUser= await User.findOne({
    $or:[{userName},{email}]
   })

//    console.log("Existed User",existedUser)
//    console.log("Existed UserName",existedUser?.userName)


   if(!existedUser){
    throw new ApiError(401,"Invalid Credentials")
   }

//    if(!password)
//    {
//     throw new ApiError(404,"Password is not found")
//    }
   
   const passwordCheck=await existedUser.isPasswordCorrect(password)

//    console.log(passwordCheck);

   if(!passwordCheck)
   {
    throw new ApiError(401,"Invalid password")
   }

   const {accessToken,refreshToken}=await generateAccessAndRefreshToken(existedUser._id);

   existedUser.refreshToken=refreshToken; // i can also call one more database query to get the refresh token;

   await existedUser.save({ validateBeforeSave: false });

   const userObj=existedUser.toObject();
   delete userObj.password;
   delete userObj.refreshToken;


//    existedUser.select("-password -refreshToken")

   

   res.status(201)
   .cookie("accessToken",accessToken,options)
   .cookie("refreshToken",refreshToken,options)
   .json(
    new ApiResponse(
        200,
        {
            user:{...userObj,accessToken,refreshToken}
        },
        "User logged In Successfully"
    )
   )
})

const logOutUser=asyncHandler(async(req,res)=>{
    const logoutUser=await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset: {refreshToken:""}
        },
        {
            new:true,
        }
    )

    

    // console.log("logoutUser",logoutUser)


    res.status(201)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {},
            "User logout successFully"
        )
    
    )
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    //take the refresh token from user
    // decode the refresh token from 
    // compare the refresh token from the db
    // check the refresh token expiry 
    // if everything goes well generate the access token 
    // set the access and refresh token in cookies
    // update the db for refresh token
    // return response.

    const {token}=req.body;
    if(!token)
        {
            throw new ApiError(422, "Refresh Token is missing")

        }
 
        let decodedToken;
        try {
            decodedToken=jwt.verify(token,process.env.REFRESH_TOKEN_SECRET);
        } catch (error) {
            throw new ApiError(401,"Invalid or Expired Refresh Token")
        }
      
        const user=await User.findById(decodedToken._id)

        
        // console.log("db refreshtoken",user.refreshToken)
        if(!user || user.refreshToken!=token)
            throw new ApiError(403,"User refresh token doesn't match with the records")

        const {accessToken,refreshToken}= await generateAccessAndRefreshToken(decodedToken._id)
    
        res.status(201)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",refreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken
                },
                "Access token regenerated"
            )
        )
    
    
    
})

const updatePassword = asyncHandler(async(req,res)=>{
    // take old, new and confirm password from the user 
    // get the user from the middleware
    // update only new password on db. 

    const {oldPassword,newPassword,confirmPassword}=req.body;

    if(!oldPassword || !newPassword  )
        throw new ApiError(402,"All field must be filed");

    if(newPassword!=confirmPassword)
        throw new ApiError(402,"New and confirm passowrd  don't match")

    const existedUser=await User.findById(
        req.user._id
    )

    const passwordCheck= await existedUser.isPasswordCorrect(oldPassword)

    if(!passwordCheck)
    {
        throw new ApiError(401,"Invalid Password")
    }

    existedUser.password=newPassword
    await existedUser.save({validateBeforeSave:false})

    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            {
                
            },
            "Password Changed Successfully"
        )
    )



})

const getCurrentUser=asyncHandler(async(req,res)=>{
    return res
    .status(201)
    .json(
        new ApiResponse(
            200,
            req.user,
            "current user fetched successfully"
        )
    )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,userName}=req.body;

    // console.log(fullName,email);

    if(!fullName && !userName)
    {
        // console.log(!fullName);
        throw new ApiError(400,"Atleast a field must be required")
    }
       

    const user=await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullName,
                userName
            }
        },
        {new:true}
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account detail(s) update successfully"
        )
            

        
    )
})

export {
    registerUser,
    logInUser,
    logOutUser,
    refreshAccessToken,
    updatePassword,
    getCurrentUser,
    updateAccountDetails
};