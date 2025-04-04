"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authMiddleware = authMiddleware;
exports.workerMiddleware = workerMiddleware;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = require("./config");
const config_2 = require("./config");
function authMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    try {
        const decode = jsonwebtoken_1.default.verify(authHeader, config_1.JWT_SECRET);
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
// export function workerMiddleware(req:Request, res: Response, next: NextFunction){
//     const authHeader = req.headers["authorization"] ?? "";
//     try{
//        const decode = jwt.verify(authHeader, WORKER_JWT_SECRET) as {userId: string};
//        if(decode.userId){
//         // @ts-ignore
//         req.userId = decode.userId;
//         return next();
//        }else{
//         return res.status(403).json({
//             message: "You are not authorized to access this route"
//         })
//        }
//     }catch(e){
//         return res.status(403).json({
//             message: "Invalid token"
//         })
//     }
// };
function workerMiddleware(req, res, next) {
    var _a;
    const authHeader = (_a = req.headers["authorization"]) !== null && _a !== void 0 ? _a : "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader; // Remove Bearer prefix if present
    try {
        const decode = jsonwebtoken_1.default.verify(token, config_2.WORKER_JWT_SECRET);
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
