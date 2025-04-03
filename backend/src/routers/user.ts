
import nacl from 'tweetnacl';
import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, response } from "express";
import jwt, { sign } from "jsonwebtoken";
import { createPresignedPost } from '@aws-sdk/s3-presigned-post'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { JWT_SECRET } from "../config";
import { authMiddleware } from "../middleware";
import dotenv from "dotenv";
import { createTaskInput } from "../types";
import { ZodRecord } from "zod";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
dotenv.config();

const router = Router();
const prisma = new PrismaClient();

const PARENT_WALLET_ADDRESS = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
const connection = new Connection(process.env.RPC_URL ?? "");
console.log("RCP URL", process.env.RPC_URL);

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    throw new Error("Missing AWS environment variables");
  }


const s3Client = new S3Client({
   credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
   },
   region: process.env.AWS_REGION,
});




//@ts-ignore
router.get("/task", authMiddleware, async(req, res) => {
    const taskId = req.query.taskId;
    console.log(taskId);
    console.log(typeof taskId);
    //@ts-ignore
    const userId = req.userId;
    console.log(userId);


    // Add error handling for taskId
    if (!taskId) {
        return res.status(400).json({
            message: "Task ID is required"
        });
    }

    try {
        const taskDetails = await prisma.task.findFirst({
            where: {
                user_id: Number(userId),
                id: Number(taskId)  // Make sure taskId is converted to number
            },
            include: {
                options: true
            }
        });

    console.log(taskDetails);
        

        if (!taskDetails) {
            return res.status(404).json({
                message: "Task not found or you don't have access to this task"
            });
        }

        const response = await prisma.submission.findMany({
            where: {
                task_id: Number(taskId)
            },
            include: {
                option: true
            }
        });

        console.log(response);

        // Create result object
        const result: Record<number, {
            count: number;
            options: {
                imageUrl: string;
            }
        }> = {};

        taskDetails.options.forEach(option => {
            result[option.id] = {
                count: 0,
                options: {  // Changed from 'option' to 'options' to match frontend expectation
                    imageUrl: option.image_url
                }
            };
        });

        // Count submissions
        response.forEach(r => {
            result[r.option_id].count += 1;
        });

        res.json({
            result,
            taskDetails  // Include taskDetails in response
        });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

//task route
//@ts-ignore
router.post("/task", authMiddleware, async(req, res) =>{
    //@ts-ignore
    const userId = req.userId ;
    const body = req.body;
    const parsedData =  createTaskInput.safeParse(body);

    const user = await prisma.user.findFirst({
        where: {
            id: userId
        }
    })

    if(!parsedData.success){
        return res.status(411).json({
            message: "Invalid input"
        })
    }

    const transaction = await connection.getTransaction(parsedData.data.signature, {
        maxSupportedTransactionVersion: 1
    });

    console.log(transaction);

    if ((transaction?.meta?.postBalances[1] ?? 0) - (transaction?.meta?.preBalances[1] ?? 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(1)?.toString() !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        })
    }

    if (transaction?.transaction.message.getAccountKeys().get(0)?.toString() !== user?.address) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
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
    const {publicKey, signature} = req.body;
    const signedString = "Sign in to SolaGig";
    const message = new TextEncoder().encode(signedString);
    const result = nacl.sign.detached.verify(
        message,
        new Uint8Array(signature.data),
        new PublicKey(publicKey).toBytes(),
      );

      console.log(result);

    const existingUser = await prisma.user.findFirst({
        where:{
            address: publicKey
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
                address: publicKey,
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
    
      try{
        const { url, fields } = await createPresignedPost(s3Client, {
            Bucket: 'solagigbucket',
            Key: `${userId}/${Date.now()}/image.jpg`,
            Conditions: [
              ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
            ],
            Fields: {
              success_action_status: '201',
              'Content-Type': 'image/jpg'
            },
            Expires: 3600
          })
          
          console.log({ url, fields })
        res.json({
            presignedUrl : url ,
            fields
        })
      }catch(e){
        console.log(e)
      }
      
});

export default router;