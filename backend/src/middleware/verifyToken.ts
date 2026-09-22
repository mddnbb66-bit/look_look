import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { fail, RespCode } from "../utils/response.ts";
//此文件用于验证前端来的 Authorization（即是请求头）
// 登录后查询项目，目的是使用 token 证明身份.进入查询项目的路由
declare global {
	namespace Express {
		interface Request {
			user?: jwt.JwtPayload | string;
		}
	}
}
//  Authorization 是请求头 长这样Authorization: Bearer abc123 后面是token
export function verifyToken(req: Request, res: Response, next: NextFunction) {
	const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

	let token: string | null = null;
	const authorization = req.headers.authorization;
	//是否以bearer开头
	if (authorization?.startsWith("Bearer ")) {
		token = authorization.slice(7); //切片
	}

	if (!token && req.query?.token) {
		token = req.query.token as string;
	}
	// 没有token? 返回错误信息
	if (!token) {
		return fail(res, "UnAuthorized", RespCode.UNAUTHORIZED, 403);
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
		// 走查询项目的路由。
		// 继续下一个中间件
	} catch {
		return fail(res, "UnAuthorized", RespCode.UNAUTHORIZED, 403);
	}
}
