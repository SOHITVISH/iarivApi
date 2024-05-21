import mongoose from "mongoose";
import { log } from "../index";
import path from 'path';
import dotenv from 'dotenv';


const envPath = path.resolve(__dirname,'../..', '.env');
dotenv.config({ path: envPath });

const MONGODB_URL = process.env.MONGODB_URL

const connect = async () => {
    try {
        if(MONGODB_URL){
        await mongoose.connect(MONGODB_URL)
        log.info(`MongoDB connected`)
        console.log("MongoDB connected");
        }
    } catch (error) {
        console.log("Not Connected", error);
        log.error(`MongoDB Not Connected ${error}`)
    }
}

export default connect 
