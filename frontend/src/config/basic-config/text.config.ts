import type { TextComponentType } from "@/core/schema/ownType";

/**
 * Text组件默认配置
 */
export const textDefaultConfig: TextComponentType = {
	id: "",
	type: "Text",
	name: "文本",
	props: {
		content: "示例文本",
		fontSize: 16,
		fontWeight: 400,
		color: "#000000",
		textAlign: "左",
	},
	style: {
		top: 0,
		left: 0,
		width: 200,
		height: 30,
		zIndex: 1,
	},
};
