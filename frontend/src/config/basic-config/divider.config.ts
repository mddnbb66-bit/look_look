import type { DividerComponentType } from "@/core/schema/ownType";

export const dividerDefaultConfig: DividerComponentType = {
	id: "",
	type: "Divider",
	name: "分割线",
	props: {
		direction: "horizontal",
		text: "",
		textPosition: "center",
		lineStyle: "solid",
		color: "#d9d9d9",
	},
	style: {
		top: 0,
		left: 0,
		width: 300,
		height: 40,
		zIndex: 1,
	},
};
