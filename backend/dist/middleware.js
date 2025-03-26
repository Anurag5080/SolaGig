"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.workerMiddleware = workerMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const _1 = require(".");
const worker_1 = require("./routers/worker");
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decode = jsonwebtoken_1.default.verify(authHeader, _1.JWT_SECRET);
        if (decode.userId) {
            // @ts-ignore
            req.userId = decode.userId;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You are not authorized to access this route"
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "Invalid token"
        });
    }
}
;
function workerMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decode = jsonwebtoken_1.default.verify(authHeader, worker_1.WORKER_JWT_SECRET);
        if (decode.userId) {
            // @ts-ignore
            req.userId = decode.userId;
            return next();
        }
        else {
            return res.status(403).json({
                message: "You are not authorized to access this route"
            });
        }
    }
    catch (e) {
        return res.status(403).json({
            message: "Invalid token"
        });
    }
}
;
