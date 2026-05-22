import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";
import { fail, RespCode } from "../utils/response.ts";

declare global {
	namespace Express {
		interface Request {
			user?: jwt.JwtPayload | string;
		}
	}
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
	const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";

	let token: string | null = null;
	const authorization = req.headers.authorization;
	if (authorization?.startsWith("Bearer ")) {
		token = authorization.slice(7);
	}

	if (!token && req.query?.token) {
		token = req.query.token as string;
	}

	if (!token) {
		return fail(res, "UnAuthorized", RespCode.UNAUTHORIZED, 403);
	}

	try {
		req.user = jwt.verify(token, JWT_SECRET);
		next();
	} catch {
		return fail(res, "UnAuthorized", RespCode.UNAUTHORIZED, 403);
	}
}
