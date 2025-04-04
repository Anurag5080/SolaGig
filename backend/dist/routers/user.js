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
exports.encodeImageFromS3 = encodeImageFromS3;
const tweetnacl_1 = __importDefault(require("tweetnacl"));
const client_1 = require("@prisma/client");
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const s3_presigned_post_1 = require("@aws-sdk/s3-presigned-post");
const client_s3_1 = require("@aws-sdk/client-s3");
const config_1 = require("../config");
const middleware_1 = require("../middleware");
const dotenv_1 = __importDefault(require("dotenv"));
const types_1 = require("../types");
const web3_js_1 = require("@solana/web3.js");
const axios_1 = __importDefault(require("axios"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
let latestAgentDescription = "";
const PARENT_WALLET_ADDRESS = "FqZNHbTnU4NAeYys4vu329pTYHfqJzpq9R8cTZXCPcuG";
const connection = new web3_js_1.Connection((_a = process.env.RPC_URL) !== null && _a !== void 0 ? _a : "");
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
    console.log(taskId);
    console.log(typeof taskId);
    //@ts-ignore
    const userId = req.userId;
    console.log(userId);
    // Add error handling for taskId
    if (!taskId) {
        return res.status(400).json({
            message: "Task ID is required"
        });
    }
    try {
        const taskDetails = yield prisma.task.findFirst({
            where: {
                user_id: Number(userId),
                id: Number(taskId) // Make sure taskId is converted to number
            },
            include: {
                options: true
            }
        });
        console.log(taskDetails);
        if (!taskDetails) {
            return res.status(404).json({
                message: "Task not found or you don't have access to this task"
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
        console.log(response);
        // Create result object
        const result = {};
        taskDetails.options.forEach(option => {
            result[option.id] = {
                count: 0,
                options: {
                    imageUrl: option.image_url
                }
            };
        });
        // Count submissions
        response.forEach(r => {
            result[r.option_id].count += 1;
        });
        res.json({
            result,
            taskDetails // Include taskDetails in response
        });
    }
    catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
}));
//task route
//@ts-ignore
router.post("/task", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f;
    //@ts-ignore
    const userId = req.userId;
    const body = req.body;
    const parsedData = types_1.createTaskInput.safeParse(body);
    const user = yield prisma.user.findFirst({
        where: {
            id: userId
        }
    });
    if (!parsedData.success) {
        return res.status(411).json({
            message: "Invalid input"
        });
    }
    const transaction = yield connection.getTransaction(parsedData.data.signature, {
        maxSupportedTransactionVersion: 1
    });
    console.log(transaction);
    if (((_b = (_a = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _a === void 0 ? void 0 : _a.postBalances[1]) !== null && _b !== void 0 ? _b : 0) - ((_d = (_c = transaction === null || transaction === void 0 ? void 0 : transaction.meta) === null || _c === void 0 ? void 0 : _c.preBalances[1]) !== null && _d !== void 0 ? _d : 0) !== 100000000) {
        return res.status(411).json({
            message: "Transaction signature/amount incorrect"
        });
    }
    if (((_e = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(1)) === null || _e === void 0 ? void 0 : _e.toString()) !== PARENT_WALLET_ADDRESS) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
        });
    }
    if (((_f = transaction === null || transaction === void 0 ? void 0 : transaction.transaction.message.getAccountKeys().get(0)) === null || _f === void 0 ? void 0 : _f.toString()) !== (user === null || user === void 0 ? void 0 : user.address)) {
        return res.status(411).json({
            message: "Transaction sent to wrong address"
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
    const { publicKey, signature } = req.body;
    const signedString = "Sign in to SolaGig";
    const message = new TextEncoder().encode(signedString);
    const result = tweetnacl_1.default.sign.detached.verify(message, new Uint8Array(signature.data), new web3_js_1.PublicKey(publicKey).toBytes());
    console.log(result);
    const existingUser = yield prisma.user.findFirst({
        where: {
            address: publicKey
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
                address: publicKey,
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
// router.get("/presignedUrl", authMiddleware, async (req, res) => { 
//     //@ts-ignore
//     const userId = req.userId;
//       try{
//         const { url, fields } = await createPresignedPost(s3Client, {
//             Bucket: 'solagigbucket',
//             Key: `${userId}/${Date.now()}/image.jpg`,
//             Conditions: [
//               ['content-length-range', 0, 5 * 1024 * 1024] // 5 MB max
//             ],
//             Fields: {
//               success_action_status: '201',
//               'Content-Type': 'image/jpg'
//             },
//             Expires: 3600
//           })
//           console.log({ url, fields })
//         res.json({
//             presignedUrl : url ,
//             fields
//         })
//       }catch(e){
//         console.log(e)
//       }
// });
function encodeImageFromS3(imageCloudUrl) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const response = yield axios_1.default.get(imageCloudUrl, {
                responseType: 'arraybuffer',
            });
            const contentType = response.headers['content-type'] || 'image/jpeg';
            const base64 = Buffer.from(response.data).toString('base64');
            const base64Image = `data:${contentType};base64,${base64}`;
            return base64Image;
        }
        catch (error) {
            console.error('Error encoding image:', error.message);
            throw error;
        }
    });
}
function sendBase64ToAgentAI(prompt) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const response = yield axios_1.default.post("https://api-lr.agent.ai/v1/agent/l4b14tzlj2ol54db/webhook/a354d68b", {
                "user_input": prompt
            }, {
                headers: {
                    Authorization: `Bearer ${process.env.AGENT_AI_AUTH_TOKEN}`,
                    "Content-Type": "application/json"
                }
            });
            return response.data;
        }
        catch (error) {
            console.error("❌ Agent.AI API Error:", ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
            throw error;
        }
    });
}
//@ts-ignore
router.get("/agent-response", (req, res) => {
    if (!latestAgentDescription) {
        return res.status(404).json({ message: "No description available yet." });
    }
    res.json({ message: latestAgentDescription });
});
//@ts-ignore
router.get("/presignedUrl", middleware_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.userId;
    try {
        const { url, fields } = yield (0, s3_presigned_post_1.createPresignedPost)(s3Client, {
            Bucket: 'solagigbucket',
            Key: `${userId}/${Date.now()}/image.jpg`,
            Conditions: [['content-length-range', 0, 5 * 1024 * 1024]],
            Fields: {
                success_action_status: '201',
                'Content-Type': 'image/jpg'
            },
            Expires: 3600
        });
        const imageURL = `${process.env.CLOUD_FRONT_URL}/${fields.key}`;
        console.log("⏳ Waiting 3 seconds for CloudFront to be ready...");
        // Delay and then encode + send to AgentAI
        setTimeout(() => __awaiter(void 0, void 0, void 0, function* () {
            try {
                const base64Image = yield encodeImageFromS3(imageURL);
                const agentResponse = yield sendBase64ToAgentAI(`Describe the image in exactly 30 words. Do not include any titles, labels, or extra characters. Output only the description—no introduction, no summary, no punctuation outside the description itself. ${base64Image}`);
                latestAgentDescription = agentResponse.response;
                console.log("🎯 AgentAI Response:", agentResponse);
            }
            catch (error) {
                console.error("❌ Error after delay:", error.message);
            }
        }), 3000);
        // Immediately return upload URL to frontend
        res.json({
            presignedUrl: url,
            fields,
            cloudFrontUrl: imageURL
        });
    }
    catch (e) {
        console.error("❌ Error generating presigned URL:", e);
        res.status(500).json({
            message: "Error generating presigned URL"
        });
    }
}));
exports.default = router;
