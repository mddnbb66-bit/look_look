import type React from "react";
import type { ContainerRendererProps } from "@/core/schema/types";
import DroppableItem from "@/core/dnd-kit/DroppableItem";
import type { PageDSL } from "@/core/schema/page";
// import { nanoid } from "nanoid"  // 不再需要
import { normalizeGridSize } from "@/core/utils/grid";

/**
 * 根容器组件
 * @param node renderer传进来的节点数据
 * @param renderChildren 渲染子组件的函数
 * @returns 返回一个div，里面渲染子组件
 */
export default function RootContainer({
	node,
	renderChildren,
	mode = "edit",
}: ContainerRendererProps) {
	const pageNode = node as PageDSL;
	// 依据页面 DSL 规范化网格尺寸，供可视网格与吸附参考
	const gridSize = normalizeGridSize(pageNode.settings.gridSize);

	const containerStyle: React.CSSProperties = {
		position: "relative",
		width: pageNode.settings.width,
		height: pageNode.settings.height,
		backgroundColor: pageNode.settings.backgroundColor || "#ffffff",
		backgroundImage: pageNode.settings.backgroundImage
			? `url(${pageNode.settings.backgroundImage})`
			: undefined,
		backgroundSize: "cover",
		backgroundRepeat: "no-repeat",
	};

	// 编辑态叠加网格背景，作为吸附可视化提示；不拦截指针事件
	const gridLayer =
		mode === "edit" ? (
			<div
				style={{
					position: "absolute",
					inset: 0, // 等价于 top: 0, left: 0, right: 0, bottom: 0
					pointerEvents: "none", // 不拦截指针事件
					backgroundSize: `${gridSize}px ${gridSize}px`,
					backgroundImage:
						"linear-gradient(to right, rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.06) 1px, transparent 1px)",
					opacity: 0.6,
				}}
			/>
		) : null;

	const content = (
		<div style={containerStyle}>
			{gridLayer}
			{renderChildren(node.children || [])}
		</div>
	);

	if (mode === "preview") {
		return content;
	}

	return <DroppableItem id={node.id}>{content}</DroppableItem>;
}
