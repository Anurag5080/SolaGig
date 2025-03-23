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
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = "secret";
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
        }, JWT_SECRET);
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
        }, JWT_SECRET);
        res.json({
            token
        });
    }
}));
exports.default = router;
