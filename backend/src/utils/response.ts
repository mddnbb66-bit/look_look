import type { Response } from "express";
//业务码主要给业务代码判断
export const RespCode = {
	SUCCESS: 0,
	VALIDATION: 40001,
	UNAUTHORIZED: 40101,
	CONFLICT: 40901,
	SERVER_ERROR: 50000,
} as const;

export type RespCodeValue = (typeof RespCode)[keyof typeof RespCode];
// typeof RespCode 这是值 后面是名
// type RespCodeValue = 0 | 40001 | 40101 | 40901 | 50000; 等价这个
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
	message = "error", // 默认值
	code: RespCodeValue = RespCode.SERVER_ERROR, // ：类型=默认值
	httpStatus = 500
) {
	return res.status(httpStatus).json({ code, message });
}
// code             : RespCodeValue       = RespCode.SUCCESS
// 参数名          类型                   默认值
