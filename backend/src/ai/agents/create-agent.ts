import { createAgent, toolStrategy, summarizationMiddleware } from "langchain";
import { MemorySaver } from "@langchain/langgraph";
import { ChatOpenAI } from "@langchain/openai";
import { componentTools } from "../tools/component-tools.ts";
import { integrationTools } from "../tools/integration-tools.ts";
import { pageSchema } from "../schema.ts";
import { buildSystemMessage } from "../prompt.ts";
import dotenv from "dotenv";

dotenv.config();

const checkpointer = new MemorySaver();
const systemPrompt = buildSystemMessage();

export const agent = createAgent({
	model: new ChatOpenAI({
		model: "deepseek-chat",
		apiKey: process.env.DEEPSEEK_API_KEY,
		configuration: {
			baseURL: process.env.DEEPSEEK_BASE_URL,
		},
		temperature: 0.5
	}),
	middleware: [
		summarizationMiddleware({
			model: new ChatOpenAI({
				model: "deepseek-chat",
				apiKey: process.env.DEEPSEEK_API_KEY,
				configuration: {
					baseURL: process.env.DEEPSEEK_BASE_URL,
				},
			}),
			trigger: { tokens: 500000, messages: 10 },
			keep: { messages: 10 },
		}),
	],
	checkpointer,
	tools: [...componentTools, ...integrationTools],
	responseFormat: toolStrategy(pageSchema),
	systemPrompt,
});
