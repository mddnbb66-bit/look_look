import { loadAndSplitDocs } from "./loader";
import { getVectorStore, getCollection } from "./store";
import dotenv from "dotenv";

dotenv.config();

/**
 * 构建知识库索引
 * - 清空现有向量集合
 * - 加载 docs/ 下所有文档并分块
 * - 向量化后写入 MongoDB Atlas Vector Search
 *
 * @param {Object} [options]
 * @param {boolean} [options.clean=true] - 是否先清空集合再重建
 */
export async function buildIndex({ clean = true } = {}) {
	console.log("[knowledge/indexer] 开始构建知识库索引...");

	// 1. 加载并分块文档
	const chunks = await loadAndSplitDocs();

	if (chunks.length === 0) {
		console.warn("[knowledge/indexer] 没有文档需要索引");
		return;
	}

	// 2. 清空现有数据（可选）
	if (clean) {
		const collection = await getCollection();
		const deleteResult = await collection.deleteMany({});
		console.log(`[knowledge/indexer] 已清空集合，删除 ${deleteResult.deletedCount} 条记录`);
	}

	// 3. 向量化并写入
	const vectorStore = await getVectorStore();
	await vectorStore.addDocuments(chunks);

	console.log(`[knowledge/indexer] 索引构建完成，共写入 ${chunks.length} 个向量`);
}

// 支持直接运行：node src/ai/knowledge/indexer.js
const isDirectRun =
	process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, "/"));

if (isDirectRun) {
	buildIndex()
		.then(() => {
			console.log("[knowledge/indexer] 索引任务完成");
			process.exit(0);
		})
		.catch((err) => {
			console.error("[knowledge/indexer] 索引任务失败", err);
			process.exit(1);
		});
}
