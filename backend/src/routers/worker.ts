import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, response } from "express";
import jwt, { sign } from "jsonwebtoken";
import { JWT_SECRET, WORKER_JWT_SECRET } from "../config";
import { workerMiddleware } from "../middleware";
import { getNewTask } from "../db";
import { createSubmissionInput } from "../types";
import { warnOnce } from "@prisma/client/runtime/library";
import nacl from "tweetnacl";
import { PublicKey } from "@solana/web3.js";

const router = Router();
const prisma = new PrismaClient();
const TOTAL_SUBMISSIONS = 10;




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

    const existingUser = await prisma.worker.findFirst({
        where:{
            address: publicKey
        }
    })
    if(existingUser){
        const token  = jwt.sign({
            userId : existingUser.id
        }, WORKER_JWT_SECRET)

        res.json({
            token
        })
    }
    else{
        const user  = await prisma.worker.create({
            data:{
                address: publicKey,
                pending_ammont: 0,
                locked_amount:0
            }
        })

        const token = jwt.sign({
            userId: user.id
        }, WORKER_JWT_SECRET)

        res.json({
            token
        })
    }

});

//@ts-ignore
router.get("/nextTask", workerMiddleware, async(req, res)=>{

    //@ts-ignore
    const userId = req.userId;
    console.log(userId);
    
    const task = await getNewTask(userId);
    console.log(task); 
    if(!task){
        res.status(411).json({
            message: "No tasks available for review"
        })
    }else{
        res.status(200).json({
            task
        })
    }


})

//@ts-ignore
router.post("/submission", workerMiddleware, async(req, res)=>{
    //@ts-ignore
    const userid = req.userId;
    const body = req.body;
    const parsedData = createSubmissionInput.safeParse(body);

    if(parsedData.success){
        const task = await getNewTask(userid);
        if(!task || task.id !== Number(parsedData.data.taskId)){
            return res.status(411).json({
                message: "Invalid task id"
            })
        }

        console.log(parsedData)

        const amount  = (Number(task.amount ) * 10000/ TOTAL_SUBMISSIONS).toString();

        const submission  =await prisma.$transaction(async tx =>{
            const submission = await tx.submission.create({
                data:{
                    option_id: Number(parsedData.data.selection),
                    worker_id: userid,
                    task_id: Number(parsedData.data.taskId),
                    amount
                }
            })

            await tx.worker.update({
                where:{
                    id: userid
                },
                data:{

                    pending_ammont: {
                        increment: Number(amount)
                    }
                }
            })

            return submission;

        })

        

        const nextTask = await getNewTask(userid);
        res.json({
            nextTask,
            amount
        })

        
    }
})

//@ts-ignore
router.get("/balance", workerMiddleware, async(req, res) =>{
    //@ts-ignore
        const userId : String = req.userId,
        const worker = await prisma.worker.findFirst({
            where:{
                id: Number(userId)
            }
        })
    
        res.json({
            pendingAmount : worker?.pending_ammont,
            lockedAmount : worker?.locked_amount,
        })
    })

//@ts-ignore
router.post("/payout", workerMiddleware, async(req, res) =>{
//@ts-ignore
    const userId = req.userId,
    const worker = await prisma.worker.findFirst({
        where:{
            id: userId
        }
    })

    if(!worker){
        res.status(403).json({
            message: "Worker Not Found"
        })
    }

    const address = worker?.address;
    const tnxId = "0x1222122550";

    //sending all the transction to blockchain
    await prisma.$transaction(async tx=>{
        await tx.worker.update({
            where:{
                id: userId
            },
            data:{
                pending_ammont:{
                    decrement: worker?.pending_ammont
                },
                locked_amount:{
                    increment: worker?.pending_ammont
                }
            }
        })

        await tx.payouts.create({
            data:{
                user_id : Number(userId),
                amount: Number(worker?.pending_ammont),
                status: "Processing",
                signature: tnxId

            }
        })
    })

    res.json({
        message: "Processing Payment",
        amount: worker?.pending_ammont
    })


})    
    
    
    
    
export default router;