import express from "express";
import type { Request, Response } from "express";
import { nanoid } from "nanoid";
import { generateSchema } from "../ai/pipelines/create-pipeline.ts";
import { answerQuestion } from "../ai/pipelines/rag-pipeline.ts";
import { ok, fail, RespCode, type RespCodeValue } from "../utils/response.ts";

const router = express.Router();

const VALID_MODE = new Set(["step", "full"]);

interface GenerateParamsSuccess {
	ok: true;
	prompt: string;
	mode: string;
	sessionId: string;
	pageId: string | null;
	existingComponents: any[];
}

interface GenerateParamsError {
	ok: false;
	message: string;
	code: RespCodeValue;
	status: number;
}

type GenerateParams = GenerateParamsSuccess | GenerateParamsError;

function parseGenerateParams(source: any): GenerateParams {
	const prompt = source?.prompt;
	const mode = source?.mode ?? "step";
	const sessionId = source?.sessionId || nanoid();
	const pageId = source?.pageId || null;

	let existingComponents: any[] = [];
	try {
		if (source?.existingComponents) {
			existingComponents = JSON.parse(source.existingComponents);
		}
	} catch {
		// 解析失败则忽略，使用空数组
	}

	if (!prompt) {
		return {
			ok: false,
			message: "prompt 不能为空",
			code: RespCode.VALIDATION,
			status: 400,
		};
	}
	if (!VALID_MODE.has(mode)) {
		return {
			ok: false,
			message: "mode 不合法，应为 step/full",
			code: RespCode.VALIDATION,
			status: 400,
		};
	}
	return { ok: true, prompt, mode, sessionId, pageId, existingComponents };
}

interface SSEParams {
	prompt: string;
	mode: string;
	sessionId: string;
	pageId: string | null;
	existingComponents: any[];
}

async function handleGenerateSchemaSSE(
	req: Request,
	res: Response,
	{ prompt, mode, sessionId, pageId, existingComponents }: SSEParams
) {
	const abortController = new AbortController();
	let closed = false;

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders?.();

	const send = (event: string, data: unknown) => {
		if (closed) return;
		res.write(`event: ${event}\n`);
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	};

	const finish = () => {
		if (closed) return;
		closed = true;
		res.end();
	};

	const closeHandler = () => {
		abortController.abort();
		finish();
	};
	req.on("close", closeHandler);

	send("start", { mode, sessionId });

	try {
		await generateSchema({
			userPrompt: prompt,
			mode,
			sessionId,
			pageId,
			existingComponents,
			abortSignal: abortController.signal,
			onProgress: send,
		});
		send("end", { ok: true, sessionId });
	} catch (err: any) {
		if (err?.name === "AbortError") {
			send("end", { ok: false, cancelled: true });
		} else {
			send("error", { message: err?.message || "生成失败，请稍后重试" });
			send("end", { ok: false });
		}
	} finally {
		req.off("close", closeHandler);
		finish();
	}
}

router.get("/schema/generate", async (req: Request, res: Response) => {
	const parsed = parseGenerateParams(req.query);
	if (!parsed.ok) {
		return fail(res, parsed.message, parsed.code, parsed.status);
	}

	const { prompt, mode, sessionId, pageId, existingComponents } = parsed;
	try {
		if (mode === "step") {
			return await handleGenerateSchemaSSE(req, res, {
				prompt,
				mode,
				sessionId,
				pageId,
				existingComponents,
			});
		}
		await generateSchema({
			userPrompt: prompt,
			mode,
			sessionId,
			pageId,
			existingComponents,
		});
		return ok(res, { sessionId }, "生成成功");
	} catch (err: any) {
		console.error("[ai/schema/generate][GET] error", err);
		const message = err?.message || "生成失败，请稍后重试";
		return fail(res, message, RespCode.SERVER_ERROR, 500);
	}
});

router.post("/schema/generate", async (req: Request, res: Response) => {
	const parsed = parseGenerateParams(req.body);
	if (!parsed.ok) {
		return fail(res, parsed.message, parsed.code, parsed.status);
	}
	const { prompt, mode, sessionId, pageId, existingComponents } = parsed;

	try {
		if (mode === "step") {
			return await handleGenerateSchemaSSE(req, res, {
				prompt,
				mode,
				sessionId,
				pageId,
				existingComponents,
			});
		} else {
			await generateSchema({
				userPrompt: prompt,
				mode,
				sessionId,
				pageId,
				existingComponents,
			});
		}
		return ok(res, { sessionId }, "生成成功");
	} catch (err: any) {
		console.error("[ai/schema/generate] error", err);
		const message = err?.message || "生成失败，请稍后重试";
		return fail(res, message, RespCode.SERVER_ERROR, 500);
	}
});

// ===================== RAG 问答 =====================

router.get("/chat", async (req: Request, res: Response) => {
	const question = req.query?.question as string | undefined;
	const sessionId = (req.query?.sessionId as string) || nanoid();

	if (!question) {
		return fail(res, "question 不能为空", RespCode.VALIDATION, 400);
	}

	const abortController = new AbortController();
	let closed = false;

	res.setHeader("Content-Type", "text/event-stream");
	res.setHeader("Cache-Control", "no-cache");
	res.setHeader("Connection", "keep-alive");
	res.flushHeaders?.();

	const send = (event: string, data: unknown) => {
		if (closed) return;
		res.write(`event: ${event}\n`);
		res.write(`data: ${JSON.stringify(data)}\n\n`);
	};

	const finish = () => {
		if (closed) return;
		closed = true;
		res.end();
	};

	const closeHandler = () => {
		abortController.abort();
		finish();
	};
	req.on("close", closeHandler);

	send("start", { sessionId });

	try {
		await answerQuestion({
			question,
			sessionId,
			abortSignal: abortController.signal,
			onProgress: send,
		});
		send("end", { ok: true, sessionId });
	} catch (err: any) {
		if (err?.name === "AbortError") {
			send("end", { ok: false, cancelled: true });
		} else {
			console.error("[ai/chat] error", err);
			send("error", { message: err?.message || "回答失败，请稍后重试" });
			send("end", { ok: false });
		}
	} finally {
		req.off("close", closeHandler);
		finish();
	}
});

export default router;
