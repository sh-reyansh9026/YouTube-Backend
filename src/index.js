// function(){}
// or
//iffy ()()->execute immediately
//while db connection assume database always resides in another continent
//so we have to wait for data to fetch or come that's why we always use async await and try catch block
import connectDB from "./db/index.js";
import {app} from './app.js'
//2nd method
// require('dotenv').config({path:'./.env'})
//or
import dotenv from 'dotenv';
// changes in dependencues of packAGE .JSON ALSO


dotenv.config({
    path: './.env'
});

connectDB()
    // for this .then and .catch , it is used everytime so a syncHandler file in utils folder is made to writr this code in that and use whereever required
    .then(() => {
        app.listen(process.env.PORT || 8000, () => {
            console.log(`Server is running on port : ${process.env.PORT}`);
        })
    })
    .catch((err) => {
        console.log("MONODB connection failed !!!", err);
        
})

// 1st approach

// import express from "express"
// const app=express()
// (async () => {
//     try {
//         await mongoose.connect(`${process.env.
//             MONGODB_URI}/${DB_NAME}`)
        
//         app.on("error", (error) => {
//             console.log("ERROR:", error);
//             throw error;
//         })

//         app.listen(process.env.PORT, () => {
//             console.log(`App is running on port ${process.env.PORT}`);
//         })

//     } catch (error) {
//         console.error("ERROR:", error);
//         throw error;
//     }
//  })() 