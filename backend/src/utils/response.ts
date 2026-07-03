import type { Response } from "express";

export const RespCode = {
	SUCCESS: 0,
	VALIDATION: 40001,
	UNAUTHORIZED: 40101,
	CONFLICT: 40901,
	SERVER_ERROR: 50000,
} as const;

export type RespCodeValue = (typeof RespCode)[keyof typeof RespCode];

export function ok(
	res: Response,
	data: unknown = null,
	message = "ok",
	code: RespCodeValue = RespCode.SUCCESS
) {
	return res.json({ code, message, data });
}
//按时
//返回格式
export function fail(
	res: Response,
	message = "error",
	code: RespCodeValue = RespCode.SERVER_ERROR,
	httpStatus = 500
) {
	return res.status(httpStatus).json({ code, message });
}
