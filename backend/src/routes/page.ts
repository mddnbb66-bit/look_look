import express from "express";
import mongoose from "mongoose";
import Page from "../models/Page.ts";
import { ok, fail, RespCode } from "../utils/response.ts";
import type { Request, Response } from "express";

const router = express.Router();

// 获取当前用户的页面列表：按更新时间倒序
router.get("/", async (req: Request, res: Response) => {
	try {
		const { userId } = req.query;
		if (!userId || !mongoose.Types.ObjectId.isValid(userId as string)) {
			return fail(res, "userId 不合法", RespCode.VALIDATION, 400);
		}
		// 下面是做一份查询(查谁, 取哪些字段).设置排序(怎么排)
		const pages = await Page.find(
			{ owner: userId },
			"name title description thumbnailUrl createdAt updatedAt"
		).sort({ updatedAt: -1 });
		//把每一个字段取出来，其中把_id变成pageId
		const data = pages.map((page) => ({
			pageId: page._id.toString(),
			name: page.name,
			title: page.title,
			description: page.description,
			thumbnailUrl: page.thumbnailUrl,
			createdAt: page.createdAt,
			updatedAt: page.updatedAt,
		}));

		return ok(res, data, "获取成功");
	} catch (err) {
		console.error("[pages/list] error", err);
		return fail(res, "获取失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

// 保存页面 schema：支持创建与更新
router.post("/save", async (req: Request, res: Response) => {
	const { pageId, schema, meta = {}, thumbnail, userId } = req.body || {};
	const uid = (req.user as any).uid;
	if (!schema) {
		return fail(res, "schema 不能为空", RespCode.VALIDATION, 400);
	}

	const payload: Record<string, any> = {
		schema,
		name: schema?.name ?? "",
		title: meta.title ?? schema?.props?.title ?? "",
		description: meta.description ?? schema?.props?.description ?? "",
	};

	// 仅在前端传入缩略图时更新，避免覆盖旧图
	if (typeof thumbnail === "string" && thumbnail.length) {
		payload.thumbnailUrl = thumbnail;
	}

	try {
		let pageDoc;
		//if更新，else创建
		if (pageId) {
			if (!mongoose.Types.ObjectId.isValid(pageId)) {
				return fail(res, "pageId 格式不合法", RespCode.VALIDATION, 400);
			}

			pageDoc = await Page.findOneAndUpdate({ _id: pageId, owner: uid }, payload, {
				new: true, //返回新的数据
			});
			// Page.findByIdAndUpdate(id, 更新内容, 配置)

			if (!pageDoc) {
				return fail(res, "未找到对应页面", RespCode.VALIDATION, 404);
			}
		} else {
			if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
				return fail(res, "userId 不合法", RespCode.VALIDATION, 400);
			}
			pageDoc = await Page.create({ ...payload, owner: userId });
		}

		return ok(res, pageDoc.toSafeJSON(), "保存成功");
	} catch (err) {
		console.error("[pages/save] error", err);
		return fail(res, "保存失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

// 获取指定页面 schema
//这是单个项目的查询接口 。为啥要这个呢？因为列表显示的全部卡片的摘要。
router.get("/:pageId", async (req: Request, res: Response) => {
	const { pageId } = req.params || {};
	if (!pageId) {
		return fail(res, "pageId 不能为空", RespCode.VALIDATION, 400);
	}
	const uid = (req.user as any).uid; //改掉了原项目的bug 越权访问的问题 原来是只靠项目id查询，现在考项目id和uid来查询
	try {
		const pageDoc = await Page.findOne({ _id: pageId, owner: uid });
		if (!pageDoc) {
			return fail(res, "未找到对应页面", RespCode.VALIDATION, 404);
		}

		return ok(res, pageDoc.toSafeJSON(), "获取成功");
	} catch (err) {
		console.error("[pages/get] error", err);
		return fail(res, "获取失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

// 删除指定页面：先校验 id 合法性再执行删除
router.delete("/:pageId", async (req: Request, res: Response) => {
	const { pageId } = req.params || {};
	const uid = (req.user as any).uid;
	if (!pageId) {
		return fail(res, "pageId 不能为空", RespCode.VALIDATION, 400);
	}

	if (!mongoose.Types.ObjectId.isValid(pageId as string)) {
		return fail(res, "pageId 格式不合法", RespCode.VALIDATION, 400);
	}

	try {
		const pageDoc = await Page.findOneAndDelete({ _id: pageId, owner: uid });
		if (!pageDoc) {
			return fail(res, "未找到对应页面", RespCode.NOT_FOUND, 404);
		}

		return ok(res, { pageId: pageId }, "删除成功");
	} catch (err) {
		console.error("[pages/delete] error", err);
		return fail(res, "删除失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

export default router;

// 为什么还要单个项目的查询接口？
// 你说得对：列表已经包含当前用户的项目。但原项目列表返回的是“摘要”，不是完整编辑数据。
// 使用位置	需要的数据
// 项目列表	多个项目的名称、缩略图、更新时间等
// 编辑器	某一个项目的完整数据，尤其是 schema

// 我核对了原项目：列表响应没有 schema；编辑器调用 getPageById(id)，取得 data.schema 后用于编辑。
// 还有一个实际场景：用户直接打开或刷新 /editor/某个ID，并没有先进入项目列表。 编辑器也应能凭这个 ID 加载项目，而不是依赖列表页之前保存的状态。
// 所以不是“再取一张卡片”，而是加载一个项目供编辑。技术上并非必须拆成两个接口，但这是原项目的职责划分，我们沿用。
