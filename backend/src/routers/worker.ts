import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, response } from "express";
import jwt, { sign } from "jsonwebtoken";
import { JWT_SECRET } from "..";
import { workerMiddleware } from "../middleware";
import { getNewTask } from "../db";
import { createSubmissionInput } from "../types";

const router = Router();
const prisma = new PrismaClient();
export const WORKER_JWT_SECRET  = JWT_SECRET + "WORKER";
const TOTAL_SUBMISSIONS = 10;




router.post("/signin", async(req, res)=>{
    //sign in verification logic
    const hardcodedWalletAddress = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
    const existingUser = await prisma.worker.findFirst({
        where:{
            address: hardcodedWalletAddress
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
                address: hardcodedWalletAddress,
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
        res.status(411).json({
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

        const amount  = (Number(task.amount )/ TOTAL_SUBMISSIONS).toString();

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
    
    
    
    
export default router;