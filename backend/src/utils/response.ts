import type { Response } from "express";

/**
 * 业务码（自定义 code，不是 HTTP 状态码）
 * 主要给前端 / 业务代码判断“具体是哪类问题”，不要只看 HTTP 状态码
 */
export const RespCode = {
	SUCCESS: 0, // 成功
	VALIDATION: 40001, // 参数校验失败：空参数、格式不对、mode 不合法等
	UNAUTHORIZED: 40101, // 未登录 / token 失效 / 无权限
	NOT_FOUND: 40401, // 新增：资源不存在
	CONFLICT: 40901, // 业务冲突：重复创建、状态冲突、资源已存在
	SERVER_ERROR: 50000, // 服务端异常（兜底错误码）
} as const;

/**
 * RespCodeValue：RespCode 所有“值”的联合类型
 * typeof RespCode 取的是值，[keyof typeof RespCode] 取所有 key 对应的值
 * 等价于：type RespCodeValue = 0 | 40001 | 40101 | 40901 | 50000;
 */
export type RespCodeValue = (typeof RespCode)[keyof typeof RespCode];

/**
 * 成功响应，统一返回格式：{ code, message, data }
 * @param res     Express 的 Response 对象
 * @param data    返回给前端的数据，默认 null
 * @param message 提示信息，默认 "ok"
 * @param code    业务码，默认 RespCode.SUCCESS（0）
 */
export function ok(
	res: Response,
	data: unknown = null,
	message = "ok",
	code: RespCodeValue = RespCode.SUCCESS
) {
	return res.json({ code, message, data });
}

/**
 * 失败响应，统一返回格式：{ code, message }（不带 data）
 * @param res        Express 的 Response 对象
 * @param message    错误提示，默认 "error"
 * @param code       业务码，默认 RespCode.SERVER_ERROR（50000）
 * @param httpStatus HTTP 状态码，默认 500；一般和业务码对应，如 400 / 401 / 409
 */
export function fail(
	res: Response,
	message = "error",
	code: RespCodeValue = RespCode.SERVER_ERROR,
	httpStatus = 500
) {
	return res.status(httpStatus).json({ code, message });
}
