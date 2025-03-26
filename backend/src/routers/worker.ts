import { PrismaClient } from "@prisma/client";
import { Router, Request, Response, response } from "express";
import jwt, { sign } from "jsonwebtoken";
import { JWT_SECRET } from "..";
import { workerMiddleware } from "../middleware";

const router = Router();
const prisma = new PrismaClient();
export const WORKER_JWT_SECRET  = JWT_SECRET + "WORKER";

//@ts-ignore
router.get("/nextTask", workerMiddleware, async(req, res)=>{

    //@ts-ignore
    const userId = req.userId;
    console.log(userId);
    console.log(workerMiddleware)

    const task = await prisma.task.findFirst({
        where:{
            done: false,
            submissions:{
                none:{
                    worker_id: userId
                }
            }
        },
        select:{
            title: true,
            options: true
        }
    })
    console.log(task)
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

export default router;