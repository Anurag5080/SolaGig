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
import { Connection,SystemProgram, Transaction,sendAndConfirmTransaction , Keypair } from "@solana/web3.js";
import bs58 from "bs58";
import { privateKey } from "../privatekey";
const connection = new Connection(process.env.RPC_URL ?? "");
import decode from "bs58";


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
// router.post("/payout", workerMiddleware, async(req, res) =>{
// //@ts-ignore
//     const userId = req.userId,
//     const worker = await prisma.worker.findFirst({
//         where:{
//             id: userId
//         }
//     })

//     if(!worker){
//         res.status(403).json({
//             message: "Worker Not Found"
//         })
//     }

//     const transaction = new Transaction().add(
//         SystemProgram.transfer({
//             fromPubkey: new PublicKey("FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG"),
//             toPubkey:  new PublicKey(worker?.address || ""),
//             lamports: 100000000,
//         })
//     );

//     // console.log(worker.address);    

//     const keypair = Keypair.fromSecretKey(Uint8Array.from(decode.decode(privateKey)));
//     let signature = "";
//     try{
//         signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
//         console.log("Transaction signature:", signature);
//     }catch(e){
//         res.status(403).json({
//             message: "Transaction Failed"
//         })
//         console.log(e); 
//     }
  

//     //sending all the transction to blockchain
//     await prisma.$transaction(async tx=>{
//         await tx.worker.update({
//             where:{
//                 id: userId
//             },
//             data:{
//                 pending_ammont:{
//                     decrement: worker?.pending_ammont
//                 },
//                 locked_amount:{
//                     increment: worker?.pending_ammont
//                 }
//             }
//         })

//         await tx.payouts.create({
//             data:{
//                 user_id : Number(userId),
//                 amount: Number(worker?.pending_ammont),
//                 status: "Processing",
//                 signature: signature

//             }
//         })
//     })

//     res.json({
//         message: "Processing Payment",
//         amount: worker?.pending_ammont
//     })


// })    


router.post("/payout", workerMiddleware, async (req, res) => {
    //@ts-ignore
    const userId = req.userId;
    const worker = await prisma.worker.findFirst({
        where: {
            id: userId,
        },
    });

    if (!worker) {
        return res.status(403).json({
            message: "Worker Not Found",
        });
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(decode.decode(privateKey)));
    if (keypair.publicKey.toString() !== "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG") {
        return res.status(500).json({
            message: "Invalid private key configuration",
        });
    }

    const transaction = new Transaction().add(
        SystemProgram.transfer({
            fromPubkey: keypair.publicKey,
            toPubkey: new PublicKey(worker?.address || ""),
            lamports: 100000000,
        })
    );

    let signature = "";
    try {
        signature = await sendAndConfirmTransaction(connection, transaction, [keypair]);
        console.log("Transaction signature:", signature);
    } catch (e) {
        console.error(e);
        return res.status(403).json({
            message: "Transaction Failed",
        });
    }

    // Sending all the transactions to the blockchain
    await prisma.$transaction(async (tx) => {
        await tx.worker.update({
            where: {
                id: userId,
            },
            data: {
                pending_ammont: {
                    decrement: worker?.pending_ammont,
                },
                locked_amount: {
                    increment: worker?.pending_ammont,
                },
            },
        });

        await tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: Number(worker?.pending_ammont),
                status: "Processing",
                signature: signature,
            },
        });
    });

    res.json({
        message: "Processing Payment",
        amount: worker?.pending_ammont,
    });
});
    

// router.post("/payout", workerMiddleware, async (req, res) => {
//     //@ts-ignore
//     const userId = req.userId;
//     const worker = await prisma.worker.findFirst({
//         where: { id: userId },
//     });

//     if (!worker) {
//         return res.status(403).json({ message: "Worker Not Found" });
//     }

//     const secretKey = bs58.decode(process.env.PRIVATE_KEY_BASE58!);
//     const keypair = Keypair.fromSecretKey(secretKey);

//     if (keypair.publicKey.toString() !== "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG") {
//         return res.status(500).json({ message: "Invalid private key configuration" });
//     }

   

//     const latestBlockhash = await connection.getLatestBlockhash("finalized");

//     const transaction = new Transaction({
//         feePayer: keypair.publicKey,
//         blockhash: latestBlockhash.blockhash,
//         lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
//     }).add(
//         SystemProgram.transfer({
//             fromPubkey: keypair.publicKey,
//             toPubkey: new PublicKey(worker.address),
//             lamports: 100000000,
//         })
//     );

//     let signature = "";
//     try {
//         signature = await connection.sendTransaction(transaction, [keypair]);

//         // Manually confirm using polling (no WebSocket)
//         let confirmed = false;
//         const maxTries = 30;
//         for (let i = 0; i < maxTries; i++) {
//             const status = await connection.getSignatureStatus(signature);
//             if (status.value?.confirmationStatus === "confirmed" || status.value?.confirmationStatus === "finalized") {
//                 confirmed = true;
//                 break;
//             }
//             await new Promise((res) => setTimeout(res, 1000)); // wait 1 second
//         }

//         if (!confirmed) {
//             return res.status(500).json({ message: "Transaction not confirmed in time" });
//         }

//     } catch (e) {
//         console.error(e);
//         return res.status(403).json({ message: "Transaction Failed" });
//     }

//     // Update database as before
//     await prisma.$transaction(async (tx) => {
//         await tx.worker.update({
//             where: { id: userId },
//             data: {
//                 pending_ammont: { decrement: worker.pending_ammont },
//                 locked_amount: { increment: worker.pending_ammont },
//             },
//         });

//         await tx.payouts.create({
//             data: {
//                 user_id: Number(userId),
//                 amount: Number(worker.pending_ammont),
//                 status: "Processing",
//                 signature: signature,
//             },
//         });
//     });

//     res.json({
//         message: "Processing Payment",
//         amount: worker.pending_ammont,
//     });
// });
export default router;