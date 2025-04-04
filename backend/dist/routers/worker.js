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
router.post("/payout", middleware_1.workerMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const worker = yield prisma.worker.findFirst({
        where: {
            id: userId
        }
    });
    if (!worker) {
        res.status(403).json({
            message: "Worker Not Found"
        });
    }
    const address = worker === null || worker === void 0 ? void 0 : worker.address;
    const tnxId = "0x1222122550";
    //sending all the transction to blockchain
    yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        yield tx.worker.update({
            where: {
                id: userId
            },
            data: {
                pending_ammont: {
                    decrement: worker === null || worker === void 0 ? void 0 : worker.pending_ammont
                },
                locked_amount: {
                    increment: worker === null || worker === void 0 ? void 0 : worker.pending_ammont
                }
            }
        });
        yield tx.payouts.create({
            data: {
                user_id: Number(userId),
                amount: Number(worker === null || worker === void 0 ? void 0 : worker.pending_ammont),
                status: "Processing",
                signature: tnxId
            }
        });
    }));
    res.json({
        message: "Processing Payment",
        amount: worker === null || worker === void 0 ? void 0 : worker.pending_ammont
    });
}));
exports.default = router;
