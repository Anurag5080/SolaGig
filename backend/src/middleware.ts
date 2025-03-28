import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config";
import {WORKER_JWT_SECRET} from "./config";


export function authMiddleware(req:Request, res: Response, next: NextFunction){

    const authHeader = req.headers["authorization"] ?? "";

    try{
       const decode = jwt.verify(authHeader, JWT_SECRET) as {userId: string};
       
       if(decode.userId){
        // @ts-ignore
        req.userId = decode.userId;
        return next();
       }
       else{
        return res.status(403).json({
            message: "You are not authorized to access this route"
        })
       }
        
    }catch(e){
        return res.status(403).json({
            message: "Invalid token"
        })
    
    }
};



export function workerMiddleware(req:Request, res: Response, next: NextFunction){

    const authHeader = req.headers["authorization"] ?? "";

    try{
       const decode = jwt.verify(authHeader, WORKER_JWT_SECRET) as {userId: string};
       
       if(decode.userId){
        // @ts-ignore
        req.userId = decode.userId;
        return next();
        
       }else{
        return res.status(403).json({
            message: "You are not authorized to access this route"
        })
       }
        
    }catch(e){
        return res.status(403).json({
            message: "Invalid token"
        })
    
    }
};