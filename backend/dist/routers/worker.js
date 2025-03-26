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
exports.WORKER_JWT_SECRET = void 0;
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const __1 = require("..");
const middleware_1 = require("../middleware");
const db_1 = require("../db");
const types_1 = require("../types");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
exports.WORKER_JWT_SECRET = __1.JWT_SECRET + "WORKER";
const TOTAL_SUBMISSIONS = 10;
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //sign in verification logic
    const hardcodedWalletAddress = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
    const existingUser = yield prisma.worker.findFirst({
        where: {
            address: hardcodedWalletAddress
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, exports.WORKER_JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prisma.worker.create({
            data: {
                address: hardcodedWalletAddress,
                pending_ammont: 0,
                locked_amount: 0
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, exports.WORKER_JWT_SECRET);
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
        res.status(411).json({
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
        const amount = (Number(task.amount) / TOTAL_SUBMISSIONS).toString();
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
exports.default = router;
