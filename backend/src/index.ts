//加载.env的
import "dotenv/config";
import mongoose from "mongoose";
import app from "./app.ts";
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/vision-craft";

// 启动函数：连接数据库并启动服务
async function main() {
	try {
		await mongoose.connect(MONGODB_URI);
		console.log("[mongo] connected");

		app.listen(PORT, () => {
			console.log(`[server] listening on http://localhost:${PORT}`);
		});
	} catch (err) {
		console.error("启动服务失败(数据库或者后端)", err);
		process.exit(1);
	}
}

main();
