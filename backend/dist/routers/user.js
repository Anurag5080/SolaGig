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
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("../types");
dotenv_1.default.config();
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
    throw new Error("Missing AWS environment variables");
}
const s3Client = new client_s3_1.S3Client({
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    region: process.env.AWS_REGION,
});
//@ts-ignore
router.get("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = req.query.taskId;
    //@ts-ignore
    const userId = req.userId;
    const taskDetails = yield prisma.task.findFirst({
        where: {
            user_id: Number(userId),
            id: Number(taskId)
        },
        include: {
            options: true
        }
    });
    if (!taskDetails) {
        return res.status(411).json({
            message: "You don't hace access to this task"
        });
    }
    const response = yield prisma.submission.findMany({
        where: {
            task_id: Number(taskId)
        },
        include: {
            option: true
        }
    });
    // Creates a record of all options with their counts
    // First initializes all options with count 0
    // Then counts actual submissions for each option
    const result = {};
    // Initialize counts for all options
    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        };
    });
    // Count submissions for each option
    response.forEach(r => {
        result[r.option_id].count += 1;
    });
    res.json({ result });
}));
//task route
//@ts-ignore
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedData = types_1.createTaskInput.safeParse(body);
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Invalid input"
        });
    }
    //paerse the signatuer here to ensure the person paid thj money
    let resopnse = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        const transactionResponce = yield tx.task.create({
            data: {
                title: parsedData.data.title,
                amount: "1",
                signature: parsedData.data.signature,
                user_id: userId,
            }
        });
        yield tx.options.createMany({
            data: parsedData.data.options.map(x => ({
                image_url: x.imageUrl,
                task_id: transactionResponce.id
            }))
        });
        return transactionResponce;
    }));
    res.json({
        id: resopnse.id
    });
}));
//we sign in with a wallet adapter
//sign in wth a msgg
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //sign in verification logic
    const hardcodedWalletAddress = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
    const existingUser = yield prisma.user.findFirst({
        where: {
            address: hardcodedWalletAddress
        }
    });
    if (existingUser) {
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
    else {
        const user = yield prisma.user.create({
            data: {
                address: hardcodedWalletAddress,
            }
        });
        const token = jsonwebtoken_1.default.sign({
            userId: user.id
        }, config_1.JWT_SECRET);
        res.json({
            token
        });
    }
}));
//@ts-ignore
router.get("/presignedUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
            Bucket: 'solagigbucket',
            Key: `${userId}/${Date.now()}/image.jpg`,
            Conditions: [
                ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
            ],
            Fields: {
                success_action_status: '201',
                'Content-Type': 'image/jpg'
            },
            Expires: 3600
        });
        console.log({ url, fields });
        res.json({
            presignedUrl: url,
            fields
        });
    }
    catch (e) {
        console.log(e);
    }
}));
exports.default = router;
