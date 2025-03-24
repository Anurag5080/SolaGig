import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from ".";


export function authMiddleware(req:Request, res: Response, next: NextFunction){

    const authHeader = req.headers["authorization"] ?? "";

    try{
       const decode = jwt.verify(authHeader, JWT_SECRET) as {userId: string};
       
       if(decode.userId){
        // @ts-ignore
        req.userId = decode.userId;
        return next();
       }
        
    }catch(e){
        return res.status(403).json({
            message: "Invalid token"
        })
    
    }
};