import type { ContainerRendererProps } from "@/core/schema/commonType";
import DroppableItem from "@/core/dnd-kit/DroppableItem";
import type { ContainerComponentType } from "@/core/schema/ownType";
// import { nanoid } from "nanoid"  // 不再需要

/**
 * 容器组件
 * @param node renderer传进来的节点数据
 * @param renderChildren 渲染子组件的函数
 * @returns 返回一个div，里面渲染子组件
 */
export default function ContainerComponent({ node, renderChildren, mode = "edit" }: ContainerRendererProps) {
	if (mode === "preview") {
		return (
			<div style={{ width: "100%", height: "100%" }}>
				{renderChildren(node.children || [])}
			</div>
		);
	}

	return (
		<DroppableItem id={node.id} style={(node as ContainerComponentType).style}>
			<div>{renderChildren(node.children!)}</div>
		</DroppableItem>
	);
}
