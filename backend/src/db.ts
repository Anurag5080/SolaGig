import { PrismaClient } from '@prisma/client'
import { withAccelerate } from '@prisma/extension-accelerate'


const prisma = new PrismaClient().$extends(withAccelerate());

export const getNewTask = async(userId: number)=>{
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
            id: true,
            title: true,
            options: true,
            amount: true
        }
    })
    return task;

    
}