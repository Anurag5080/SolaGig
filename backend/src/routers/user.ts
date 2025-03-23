import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from "..";
import { authMiddleware } from "../middleware";
import dotenv from "dotenv";
dotenv.config();

const router = Router();
const prisma = new PrismaClient();

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    throw new Error("Missing AWS environment variables");
  }


const s3Client = new S3Client({
   credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
   },
   region: process.env.AWS_REGION
});

console.log("AWS_ACCESS_KEY_ID:", process.env.AWS_ACCESS_KEY_ID);
console.log("AWS_SECRET_ACCESS_KEY:", process.env.AWS_SECRET_ACCESS_KEY ? "HIDDEN" : "NOT SET");
console.log("AWS_REGION:", process.env.AWS_REGION);




//we sign in with a wallet adapter
//sign in wth a msgg
router.post("/signin", async(req, res)=>{
    //sign in verification logic
    const hardcodedWalletAddress = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
    const existingUser = await prisma.user.findFirst({
        where:{
            address: hardcodedWalletAddress
        }
    })
    if(existingUser){
        const token  = jwt.sign({
            userId : existingUser.id
        }, JWT_SECRET)

        res.json({
            token
        })
    }
    else{
        const user  = await prisma.user.create({
            data:{
                address: hardcodedWalletAddress,
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, JWT_SECRET)

        res.json({
            token
        })
    }

});

//@ts-ignore
router.get("/presignedUrl", authMiddleware, async (req, res) => { 
    //@ts-ignore
    const userId = req.userId;
    
      
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'decentralized-fiver',
        Key: `/fiver/${userId}/${Math.random()}/image.jpg`,
        Conditions: [
          ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
        ],
        Fields: {
          success_action_status: '201',
          'Content-Type': 'image/png'
        },
        Expires: 3600
      })
      
      console.log({ url, fields })
    res.json({
        preSignedUrl : url ,
        fields
    })
});

export default router;