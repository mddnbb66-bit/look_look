import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.ts";
import { ok, fail, RespCode } from "../utils/response.ts";
import type { Request, Response } from "express";

const router = express.Router();

const TOKEN_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const JWT_SECRET = process.env.JWT_SECRET || "dev-secret";
//jwt相关
// user 参数必须是一个对象，并且这个对象需要有 _id 和 email 两个属性。
// 其中 _id 是一个对象，并且有一个 toString() 方法，该方法返回字符串。
function signToken(user: { _id: { toString(): string }; email: string }) {
	return jwt.sign(
		{ uid: user._id.toString(), email: user.email }, //载荷
		JWT_SECRET, //密钥
		{ expiresIn: TOKEN_EXPIRES_IN } as jwt.SignOptions
	); //过期时间
}
//载荷的详解
// { uid: user._id.toString(), email: user.email }
// 也就是
// const payload = {
// 	uid: 传入参数,
// 	email: 传入参数
// }

// 注册
router.post("/register", async (req: Request, res: Response) => {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return fail(res, "邮箱和密码不能为空", RespCode.VALIDATION, 400);
	}
	try {
		//在数据库里找
		const foundUser = await User.findOne({ email });
		if (foundUser) {
			return fail(res, "邮箱已注册", RespCode.CONFLICT, 409);
		}
		//创建要存的hash
		const passwordHash = await bcrypt.hash(password, 10);
		//创建用户
		const user = await User.create({ email, passwordHash });
		//创建成功之后用方法返沪安全的数据
		return ok(res, user.toSafeJSON(), "注册成功");
	} catch (err) {
		console.error("[auth/register] error", err);
		return fail(res, "注册失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

// 登录
router.post("/login", async (req: Request, res: Response) => {
	const { email, password } = req.body || {};
	if (!email || !password) {
		return fail(res, "邮箱和密码不能为空", RespCode.VALIDATION, 400);
	}

	try {
		//这一步后端查找
		//user里面有passwordHAsh
		const user = await User.findOne({ email });
		if (!user) {
			return fail(res, "邮箱或密码错误", RespCode.UNAUTHORIZED, 401);
		}
		//password 前端传递的密码
		const isMatch = await bcrypt.compare(password, user.passwordHash);
		if (!isMatch) {
			return fail(res, "邮箱或密码错误", RespCode.UNAUTHORIZED, 401);
		}

		const token = signToken(user);
		return ok(
			res,
			{
				token,
				user: user.toSafeJSON(),
			},
			"登录成功"
		);
	} catch (err) {
		console.error("[auth/login] error", err);
		return fail(res, "登录失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

export default router;
