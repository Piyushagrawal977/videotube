// require('dotenv').config({path:'./env'})

import dotenv from "dotenv"
// import mongoose from "mongoose"
import express from "express"
// import { DB_NAME } from "./constants.js"
import { connectDB } from "./db/index.js"
import {app} from "./app.js"

dotenv.config({
  path:'./env'
})

// const app=express();

connectDB()
.then(
  ()=>{
    app.on("error",(error)=>{
      console.log("error",error);
     })
     
    app.listen(process.env.PORT || 400, ()=>{
      console.log(`App is listening on port ${process.env.PORT} `);
    })
  }
)
.catch((err)=>{
  console.error("MongoDB Connection Failed:",err)
  // process.exit(1);
})


// ;(async ()=>{
//   try {
//      await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//      app.on("error",(error)=>{
//       console.log("error",error);
//       throw error
//      })
//      app.listen(process.env.PORT,()=>{
//       console.log(`App is listening on port ${process.env.PORT} `);
//      })
//   } catch (error) {
//     console.error('Error: MongoDB Failed ',error)
//   }
 
// })()