import type { ComponentNode } from "./basic";

/**
 * 页面配置 (Page Schema)
 * 这就是最终保存到数据库的那个 JSON 对象结构
 */
export interface PageDSL {
	id: string;
	name: string; // 页面名称
	type: "RootContainer"; // 页面根节点是一个特殊的container

	// 页面描述
	props: {
		title: string;
		description: string;
	};

	// 页面级设置
	settings: {
		width: number | string; // 大屏设计稿宽度 (如 1920)
		height: number | string; // 大屏设计稿高度 (如 1080)
		backgroundColor?: string; // 背景颜色
		backgroundImage?: string; // 背景图片
		gridSize?: number; // 编辑时的吸附网格大小
	};

	// 组件树 (核心)
	// 这里的 children 就是第一层级的组件
	children?: ComponentNode[];
}
