import type { ButtonComponentType } from "@/core/schema/ownType";

/**
 * Button 组件默认配置
 */
export const buttonDefaultConfig: ButtonComponentType = {
	id: "",
	type: "Button",
	name: "按钮",
	props: {
		text: "主按钮",
		type: "primary",
		size: "middle",
		danger: false,
		block: false,
		disabled: false,
	},
	style: {
		top: 0,
		left: 0,
		width: 140,
		height: 40,
		zIndex: 1,
		borderRadius: 6,
	},
};
