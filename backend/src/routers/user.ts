import { PrismaClient } from "@prisma/client";
import { Router, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from "..";
import { authMiddleware } from "../middleware";

const router = Router();
const prisma = new PrismaClient();


const s3Client = new S3Client()




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


router.get("/presignedUrl", authMiddleware, async (req: Request, res: Response): Promise<void> => { 
    //@ts-ignore
    const userId = req.userId;
    const command = new PutObjectCommand({
        Bucket: "decentralized-fiver",
        Key: `/fiver/${userId}/${}`,
      })


      
const preSignedUrl = await getSignedUrl(s3Client, command, {
    expiresIn: 3600
  })
});

export default router;