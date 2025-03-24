"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const _1 = require(".");
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
    }
    catch (e) {
        return res.status(403).json({
            message: "Invalid token"
        });
    }
}
;
