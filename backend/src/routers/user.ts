import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, response } from "express";
import jwt, { sign } from "jsonwebtoken";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from "..";
import { authMiddleware } from "../middleware";
import dotenv from "dotenv";
import { createTaskInput } from "../types";
import { ZodRecord } from "zod";
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

//@ts-ignore
router.get("/task",authMiddleware,  async(req, res) => {
    const taskId:  string = req.query.taskId as string;
    //@ts-ignore
    const userId: string = req.userId;

    const taskDetails = await prisma.task.findFirst(
        {
            where:{
                user_id: Number(userId),
                id: Number(taskId)
            }
        }
    )

    if(!taskDetails){
        return res.status(411).json({
            message: "You don't hace access to this task"
        })
    }

    const response = await prisma.submission.findMany({
        where:{
            task_id: Number(taskId)
        }, 
        include:{
            option: true
        }
    });

    const result :Record<string, {
        count : number;
        task:{
            imageUrl: string;
        }
    }>  = {};

    response.forEach(r =>{
        if(!result[r.option_id]){
            result[r.option_id] = {
                count : 1,
                task:{
                    imageUrl: r.option.image_url
                }
            }
        }
        else{
            result[r.option_id].count +=1;
        }
    });

    res.json({result});
})

//task route
//@ts-ignore
router.post("/task", authMiddleware, async(req, res) =>{
    //@ts-ignore
    const userId = req.userId ;
    const body = req.body;
    const parsedData =  createTaskInput.safeParse(body);

    if(!parsedData.success){
        return res.status(411).json({
            message: "Invalid input"
        })
    }

    //paerse the signatuer here to ensure the person paid thj money
    let resopnse = await prisma.$transaction(async tx =>{
        const transactionResponce = await tx.task.create({
            data:{
                title: parsedData.data.title,
                amount: "1",
                signature: parsedData.data.signature,
                user_id: userId,
            }
        });

        await tx.options.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: transactionResponce.id
            }))
        });
     return transactionResponce;
        
    })

    res.json({
        id: resopnse.id
    })

})
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