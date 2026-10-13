import type { PageDSL } from "@/core/schema/page";
import { http } from "./request";

// 保存页面 schema：	前端 发给 后端 后端在req.body接受
// 仅本文件内部使用，不对外导出
interface SavePagePayload {
	// 当存在 pageId 时走更新，否则视为创建
	pageId?: string;
	schema: PageDSL; //核心数据
	meta?: {
		title?: string;
		description?: string;
	};
	// 生成的项目缩略图（base64 PNG）
	thumbnail?: string;
	// 归属用户 id（创建时必传）
	userId?: string;
}
//保存页面的响应			后端 还给 前端	后端返回 { code, message, data }
//后端返回的对象格式
export interface SavePageResponse {
	code: number;
	message: string;
	data: {
		pageId: string;
		name: string;
		title: string;
		description: string;
		schema: PageDSL;
		thumbnailUrl?: string;
		createdAt?: string;
		updatedAt?: string;
	};
}

// 页面基础信息：用于项目列表卡片
//一个卡片的信息
export interface PageSummary {
	pageId: string;
	name: string;
	title: string;
	description: string;
	thumbnailUrl?: string;
	createdAt?: string;
	updatedAt?: string;
}

// 仅本文件内部使用，不对外导出
interface DeletePageResponse {
	code: number;
	message: string;
	data?: {
		pageId: string;
	};
}

export const savePage = (payload: SavePagePayload): Promise<SavePageResponse> => {
	return http.post("/pages/save", payload);
};

// 根据页面 id 获取 schema
//新建后读取、以后打开已有项目，都可以调用这个函数，只是传入的 ID 不同。
export const getPageById = (id: string): Promise<SavePageResponse> => {
	return http.get(`/pages/${id}`);
};

// 获取当前用户的全部页面列表
export const listPages = (userId: string): Promise<PageSummary[]> => {
	return http.get("/pages", { params: { userId } });
};
//原项目bug
// 这里原项目有个类型不一致：listPages 声明返回 PageSummary[]，组件却按 { code, message, data } 使用。我们沿用函数名，但返回类型按实际响应写，不照搬这个问题。
// 不一致在于：声明说返回“数组”，实际使用时却认为返回“包着数组的对象”。
// 原项目声明：
// export const listPages = (userId: string): Promise<PageSummary[]> => {
//   return http.get("/pages", { params: { userId } });
// };
// Promise<PageSummary[]> 告诉 TS，await listPages(...) 得到的是：
// [
//   { pageId: "...", name: "项目一" }
// ]
// 但后端返回的业务响应体实际是：
// {
//   code: 0,
//   message: "获取成功",
//   data: [
//     { pageId: "...", name: "项目一" }
//   ]
// }
// 原项目组件也这样使用：
// const resp = await listPages(userId);
// const { code, data, message } = (resp as any) || {};
// 这里按对象取 code/data/message，而不是直接把 resp 当项目数组。 as any 绕过了类型检查，没有修正类型声明。
// 删除指定页面
export const deletePage = (id: string): Promise<DeletePageResponse> => {
	return http.delete(`/pages/${id}`);
};
