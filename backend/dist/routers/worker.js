"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const types_1 = require("../types");
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const web3_js_1 = require("@solana/web3.js");
const web3_js_2 = require("@solana/web3.js");
const privatekey_1 = require("../privatekey");
const connection = new web3_js_2.Connection((_a = process.env.RPC_URL) !== null && _a !== void 0 ? _a : "");
const bs58_1 = __importDefault(require("bs58"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const TOTAL_SUBMISSIONS = 10;
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //sign in verification logic
    const { publicKey, signature } = req.body;
    const signedString = "Sign in to SolaGig";
    const message = new TextEncoder().encode(signedString);
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    console.log(result);
    const existingUser = yield prisma.worker.findFirst({
        where: {
            address: publicKey
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prisma.worker.create({
            data: {
                address: publicKey,
                pending_ammont: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.WORKER_JWT_SECRET);
        res.json({
            token
        });
    }
}));
//@ts-ignore
router.get("/nextTask", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    console.log(userId);
    const task = yield (0, db_1.getNewTask)(userId);
    console.log(task);
    if (!task) {
        res.status(411).json({
            message: "No tasks available for review"
        });
    }
    else {
        res.status(200).json({
            task
        });
    }
}));
//@ts-ignore
router.post("/submission", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userid = req.userId;
    const body = req.body;
    const parsedData = types_1.createSubmissionInput.safeParse(body);
    if (parsedData.success) {
        const task = yield (0, db_1.getNewTask)(userid);
        if (!task || task.id !== Number(parsedData.data.taskId)) {
            return res.status(411).json({
                message: "Invalid task id"
            });
        }
        console.log(parsedData);
        const amount = (Number(task.amount) * 10000 / TOTAL_SUBMISSIONS).toString();
        const submission = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const submission = yield tx.submission.create({
                data: {
                    option_id: Number(parsedData.data.selection),
                    worker_id: userid,
                    task_id: Number(parsedData.data.taskId),
                    amount
                }
            });
            yield tx.worker.update({
                where: {
                    id: userid
                },
                data: {
                    pending_ammont: {
                        increment: Number(amount)
                    }
                }
            });
            return submission;
        }));
        const nextTask = yield (0, db_1.getNewTask)(userid);
        res.json({
            nextTask,
            amount
        });
    }
}));
//@ts-ignore
router.get("/balance", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: Number(userId)
        }
    });
    res.json({
        pendingAmount: worker === null || worker === void 0 ? void 0 : worker.pending_ammont,
        lockedAmount: worker === null || worker === void 0 ? void 0 : worker.locked_amount,
    });
}));
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
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: userId,
        },
    });
    if (!worker) {
        return res.status(403).json({
            message: "Worker Not Found",
        });
    }
    const keypair = web3_js_2.Keypair.fromSecretKey(Uint8Array.from(bs58_1.default.decode(privatekey_1.privateKey)));
    if (keypair.publicKey.toString() !== "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG") {
        return res.status(500).json({
            message: "Invalid private key configuration",
        });
    }
    const transaction = new web3_js_2.Transaction().add(web3_js_2.SystemProgram.transfer({
        fromPubkey: keypair.publicKey,
        toPubkey: new web3_js_1.PublicKey((worker === null || worker === void 0 ? void 0 : worker.address) || ""),
        lamports: 100000000,
    }));
    let signature = "";
    try {
        signature = yield (0, web3_js_2.sendAndConfirmTransaction)(connection, transaction, [keypair]);
        console.log("Transaction signature:", signature);
    }
    catch (e) {
        console.error(e);
        return res.status(403).json({
            message: "Transaction Failed",
        });
    }
    // Sending all the transactions to the blockchain
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
            where: {
                id: userId,
            },
            data: {
                pending_ammont: {
                    decrement: worker === null || worker === void 0 ? void 0 : worker.pending_ammont,
                },
                locked_amount: {
                    increment: worker === null || worker === void 0 ? void 0 : worker.pending_ammont,
                },
            },
        });
        yield tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: Number(worker === null || worker === void 0 ? void 0 : worker.pending_ammont),
                status: "Processing",
                signature: signature,
            },
        });
    }));
    res.json({
        message: "Processing Payment",
        amount: worker === null || worker === void 0 ? void 0 : worker.pending_ammont,
    });
}));
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
exports.default = router;
