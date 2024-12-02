import express from "express" 
import cors from "cors"
import cookieParser from "cookie-parser"
const app = express()
// app.use is used while setting of configuration or middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

//settings for data  format that in which format data is coming so we are handling it in below lines
app.use(express.json({ limit: "16kb" })) // in json format with limit of data

app.use(express.urlencoded({ extended: true, limit: "16kb" })) // in url format which is encoded extended means objects ke andr objects(nested objects)

app.use(express.static("public")) // if needed to store some pdf files ,images etc so can be stored in public folder
app.use(cookieParser()) // to apply CURD opertaion on cookies



// routes import
import userRouter from './routes/user.routes.js'

// routes declaration
// here url will be like https://localhost:8000/api/v1/users/register (because userRouter hits register route or it can be any other route also like login we do need to define again and again in apps.js file)
app.use("/api/v1/users",userRouter) // here app.use is used because routes are segregated so to call them we have to use middleware and middleware works with .use function
//when /users is used then it transfers to userRoutes where other routes are defined
export {app}