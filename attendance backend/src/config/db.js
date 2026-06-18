import mongoose from "mongoose";

const connectDB = async ()=> {
    try 
    {
        let a = await mongoose.connect(process.env.MONGO_URI)
        
        console.log("mongodb connected")
    }
catch (error)
{
console.log(error)
process.exit(1)


}
    }
export default connectDB;