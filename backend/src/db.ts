import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient();

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