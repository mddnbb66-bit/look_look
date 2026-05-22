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

		const pages = await Page.find(
			{ owner: userId },
			"name title description thumbnailUrl createdAt updatedAt"
		).sort({ updatedAt: -1 });

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

	if (!schema) {
		return fail(res, "schema 不能为空", RespCode.VALIDATION, 400);
	}

	const payload: Record<string, any> = {
		schema,
		name: meta.name ?? schema?.name ?? "",
		title: meta.title ?? schema?.props?.title ?? "",
		description: meta.description ?? schema?.props?.description ?? "",
	};

	// 仅在前端传入缩略图时更新，避免覆盖旧图
	if (typeof thumbnail === "string" && thumbnail.length) {
		payload.thumbnailUrl = thumbnail;
	}

	try {
		let pageDoc;

		if (pageId) {
			if (!mongoose.Types.ObjectId.isValid(pageId)) {
				return fail(res, "pageId 格式不合法", RespCode.VALIDATION, 400);
			}

			pageDoc = await Page.findByIdAndUpdate(pageId, payload, {
				new: true,
				upsert: false,
			});

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
router.get("/:id", async (req: Request, res: Response) => {
	const { id } = req.params || {};
	if (!id) {
		return fail(res, "pageId 不能为空", RespCode.VALIDATION, 400);
	}

	try {
		const pageDoc = await Page.findById(id);
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
router.delete("/:id", async (req: Request, res: Response) => {
	const { id } = req.params || {};
	if (!id) {
		return fail(res, "pageId 不能为空", RespCode.VALIDATION, 400);
	}

	if (!mongoose.Types.ObjectId.isValid(id as string)) {
		return fail(res, "pageId 格式不合法", RespCode.VALIDATION, 400);
	}

	try {
		const deleted = await Page.findByIdAndDelete(id);
		if (!deleted) {
			return fail(res, "未找到对应页面", RespCode.VALIDATION, 404);
		}

		return ok(res, { pageId: id }, "删除成功");
	} catch (err) {
		console.error("[pages/delete] error", err);
		return fail(res, "删除失败，请稍后重试", RespCode.SERVER_ERROR, 500);
	}
});

export default router;
