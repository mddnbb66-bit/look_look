import { buildUserMessage, buildComponentManifest } from "../prompt.ts";
import { validatePageDSL, COMPONENT_TYPES } from "../schema.ts";
import { agent } from "../agents/create-agent.ts";
import { makeCacheKey, getCache, setCache } from "../cache.ts";
import { createAbortGuard } from "../abort-guard.ts";
import { nanoid } from "nanoid";
// [memory] checkpointer + summarizationMiddleware 已在 agent.js 中统一管理历史，无需手动维护
// import { getHistory, pushToHistory } from "../memory.js";
// import { HumanMessage, AIMessage } from "@langchain/core/messages";

const MAX_RETRY = 2;

interface GenerateSchemaParams {
	userPrompt?: string;
	mode?: string;
	sessionId?: string;
	pageId?: string | null;
	existingComponents?: any[];
	abortSignal?: AbortSignal;
	onProgress?: (event: string, data: unknown) => void;
}

/**
 * 生成 schema，包含缓存、短期记忆、工具调用与结构化输出
 * 支持智能会话管理：自动判断首次请求 vs 多轮对话
 */
export async function generateSchema({
	userPrompt = "智慧园区运营大屏，显示园区概览、能耗、客流、工单",
	mode = "step",
	sessionId = "default",
	pageId = null,
	existingComponents = [],
	abortSignal,
	onProgress,
}: GenerateSchemaParams) {
	if (!userPrompt) {
		throw new Error("userPrompt 不能为空");
	}

	const guard = createAbortGuard(abortSignal);

	try {
		await guard.run(async () => {
			// [缓存检查] 避免重复调用 LLM
			const cacheKey = makeCacheKey({ userPrompt, mode });
			const cachedResult = getCache(cacheKey);
			if (cachedResult) {
				console.log(`[generateSchema] [CACHE HIT] sessionId: ${sessionId}`);
				onProgress?.("cached", { fromCache: true });
				return;
			}

			console.log(`[generateSchema] sessionId: ${sessionId}, thread_id: ${pageId || sessionId}`);

			// [构建消息链] checkpointer 自动管理历史，systemPrompt 已在 agent.js 配置，只需传当前用户消息
			// 注入组件清单，让 AI 知道当前画布已有组件的真实 id，防止编造 id
			const componentManifest = buildComponentManifest(existingComponents);
			const allMessages = [buildUserMessage(userPrompt, mode, componentManifest)];

			// [流式调用 Agent]
			const stream = await agent.stream(
				{ messages: allMessages },
				{
					signal: abortSignal,
					recursionLimit: 60,
					configurable: {
						thread_id: pageId || sessionId,
					},
				}
			);

			// [逐块处理流式响应，推送给前端]
			for await (const chunk of stream) {
				if (chunk?.tools) {
					const toolName = chunk.tools.messages[0].name;
					console.log(`[generateSchema] [TOOL CALL] ${toolName}`);
					console.log("chunk:", chunk);
					const content = chunk.tools.messages[0].content;
					const toolOutput = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));

					// toolOutput.notes 是中间态注释（组件清单），跳过推送
					if (toolOutput?.notes) continue;

					// 分类校验：只放行完整的组件节点或页面配置更新
					const isPageConfig = !toolOutput?.type && (toolOutput?.props || toolOutput?.settings);
					const isComponent = toolOutput?.type && COMPONENT_TYPES.includes(toolOutput.type);

					if (!isPageConfig && !isComponent) {
						console.log(`[generateSchema] [SKIP] 非可渲染的工具输出: ${toolName}`);
						continue;
					}

					// 组件节点兜底：确保 id 和 style 存在
					if (isComponent) {
						if (!toolOutput.id) {
							toolOutput.id = nanoid();
						}
						if (!toolOutput.style) {
							toolOutput.style = { top: 0, left: 0, width: 400, height: 240, zIndex: 1 };
						}
					}

					const toolOutputPretty = JSON.stringify(toolOutput, null, 2);
					onProgress?.("ai_chunk", {
						chunk: toolOutputPretty,
					});
				}
			}

			// [缓存存储] 下次相同prompt直接返回
			setCache(cacheKey, { success: true });
			console.log(`[generateSchema] [CACHE SAVED]`);
		});
	} catch (err: any) {
		if (err?.name === "AbortError") {
			console.log(`[generateSchema] [ABORTED] sessionId: ${sessionId}`);
		} else {
			console.error("[generateSchema] [ERROR]", err.message);
		}
		throw err;
	} finally {
		guard.dispose();
	}
}
