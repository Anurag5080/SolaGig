
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
import axios from "axios";
dotenv.config();

const router = Router();
const prisma = new PrismaClient();
let latestAgentDescription = "";

const PARENT_WALLET_ADDRESS = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
const connection = new Connection(process.env.RPC_URL ?? "");

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
// router.get("/presignedUrl", authMiddleware, async (req, res) => { 
//     //@ts-ignore
//     const userId = req.userId;
    
//       try{
//         const { url, fields } = await createPresignedPost(s3Client, {
//             Bucket: 'solagigbucket',
//             Key: `${userId}/${Date.now()}/image.jpg`,
//             Conditions: [
//               ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
//             ],
//             Fields: {
//               success_action_status: '201',
//               'Content-Type': 'image/jpg'
//             },
//             Expires: 3600
//           })
          
//           console.log({ url, fields })
//         res.json({
//             presignedUrl : url ,
//             fields
//         })
//       }catch(e){
//         console.log(e)
//       }
      
// });


export async function encodeImageFromS3(imageCloudUrl: string): Promise<string> {
    try {
      const response = await axios.get<ArrayBuffer>(imageCloudUrl, {
        responseType: 'arraybuffer',
      });
  
      const contentType = response.headers['content-type'] || 'image/jpeg';
      const base64 = Buffer.from(response.data).toString('base64');
      const base64Image = `data:${contentType};base64,${base64}`;
  
      return base64Image;
  
    } catch (error: any) {
      console.error('Error encoding image:', error.message);
      throw error;
    }
  }
  
  async function sendBase64ToAgentAI(prompt: string) {
    try {
      const response = await axios.post(
        "https://api-lr.agent.ai/v1/agent/l4b14tzlj2ol54db/webhook/a354d68b",
        {
          "user_input": prompt
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.AGENT_AI_AUTH_TOKEN}`,
            "Content-Type": "application/json"
          }
        }
      );
  
      return response.data;
  
    } catch (error: any) {
      console.error("❌ Agent.AI API Error:", error.response?.data || error.message);
      throw error;
    }
  }

//@ts-ignore
router.get("/agent-response", (req, res) => {
    if (!latestAgentDescription) {
      return res.status(404).json({ message: "No description available yet." });
    }
  
    res.json({ message: latestAgentDescription });
  });

//@ts-ignore
router.get("/presignedUrl", authMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
  
    try {
      const { url, fields } = await createPresignedPost(s3Client, {
        Bucket: 'solagigbucket',
        Key: `${userId}/${Date.now()}/image.jpg`,
        Conditions: [['content-length-range', 0, 5 * 1024 * 1024]],
        Fields: {
          success_action_status: '201',
          'Content-Type': 'image/jpg'
        },
        Expires: 3600
      });
  
      const imageURL = `${process.env.CLOUD_FRONT_URL}/${fields.key}`;
  
      console.log("⏳ Waiting 3 seconds for CloudFront to be ready...");
  
      // Delay and then encode + send to AgentAI
      setTimeout(async () => {
        try {
          const base64Image = await encodeImageFromS3(imageURL);
          const agentResponse = await sendBase64ToAgentAI(
            `Describe the image in exactly 30 words. Do not include any titles, labels, or extra characters. Output only the description—no introduction, no summary, no punctuation outside the description itself. ${base64Image}`
          );
          
          latestAgentDescription = agentResponse.response;
          console.log("🎯 AgentAI Response:", agentResponse);
        } catch (error: any) {
          console.error("❌ Error after delay:", error.message);
        }
      }, 3000);
  
      // Immediately return upload URL to frontend
      res.json({
        presignedUrl: url,
        fields,
        cloudFrontUrl: imageURL
      });
  
    } catch (e) {
      console.error("❌ Error generating presigned URL:", e);
      res.status(500).json({
        message: "Error generating presigned URL"
      });
    }
  });
export default router;