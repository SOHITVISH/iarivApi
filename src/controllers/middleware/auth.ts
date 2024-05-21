import dotenv from "dotenv"
import { } from 'dotenv/config'
import jwt from "jsonwebtoken"
const SECRET_KEY = process.env.DB_AUTH_SECRET;
import { Request, Response, NextFunction } from "express";



const auth = (req:Request, res:Response, next:NextFunction) => {
    try {
        let token:string;
        // req.header.authorization
        if (req.session.token) {

            let newToken
            if (req.session.token) {
                newToken = req.session.token
                console.log("auth");
            } else {
                //   let objs = req.headers.authorization.split(" ");
                if(req.headers.authorization){
                    let objs = req.headers.authorization.replace("Bearer", "");
                    console.log("inside if________", objs);
                    newToken = objs.trim()
                }
                

            }
            if(newToken && SECRET_KEY){
                let user = jwt.verify(newToken, SECRET_KEY);
                // req.user = user
                if(user){
                    next();
                }else{
                    res.status(400).json({ message: "Unauthorized access not allowed" })
                }
           
            }
            
        } else {
            res.status(400).json({ message: "Unauthorized access not allowed" })
        }
    }
    catch (error) {
        console.log(error);
        res.status(400).json({ message: "Unauthorized access not allowed" })
    }
}

export default auth
