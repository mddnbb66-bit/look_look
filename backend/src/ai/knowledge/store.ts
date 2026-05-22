import { MongoDBAtlasVectorSearch } from "@langchain/mongodb";
import { OpenAIEmbeddings } from "@langchain/openai";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config();

let client: MongoClient | null = null;
let vectorStore: MongoDBAtlasVectorSearch | null = null;

/**
 * 获取 MongoDB Atlas 向量存储单例
 * 首次调用时初始化连接，后续复用
 */
export async function getVectorStore() {
	if (vectorStore) return vectorStore;

	client = new MongoClient(process.env.MONGODB_ATLAS_URI!);
	await client.connect();

	const collection = client
		.db(process.env.MONGODB_ATLAS_DB_NAME)
		.collection(process.env.MONGODB_ATLAS_COLLECTION_NAME!);

	const embeddings = new OpenAIEmbeddings({
		model: process.env.ZHIPU_EMBEDDING_MODEL,
		apiKey: process.env.ZHIPU_API_KEY,
		configuration: {
			baseURL: process.env.ZHIPU_BASE_URL,
		},
	});
	// 智谱 API 不支持 base64 encoding_format（OpenAI SDK v6 默认开启），强制关闭
	embeddings.encodingFormat = "float";

	vectorStore = new MongoDBAtlasVectorSearch(embeddings, {
		collection: collection as any,
		indexName: "vector_index",
		textKey: "text",
		embeddingKey: "embedding",
	});

	console.log("[knowledge/store] MongoDBAtlasVectorSearch 初始化完成");
	return vectorStore;
}

/**
 * 获取底层 MongoDB collection（供 indexer 清空集合等操作使用）
 */
export async function getCollection() {
	if (!client) {
		client = new MongoClient(process.env.MONGODB_ATLAS_URI!);
		await client.connect();
	}
	return client
		.db(process.env.MONGODB_ATLAS_DB_NAME)
		.collection(process.env.MONGODB_ATLAS_COLLECTION_NAME!);
}

/**
 * 关闭 MongoDB 连接（优雅退出时调用）
 */
export async function closeConnection() {
	if (client) {
		await client.close();
		client = null;
		vectorStore = null;
		console.log("[knowledge/store] MongoDB 连接已关闭");
	}
}
