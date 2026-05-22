import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useSchemaStore } from "@/store/schema-store";
import { getNewComponentConfig } from "@/config";
import { nanoid } from "nanoid";
import { normalizeGridSize, snapToGrid } from "@/core/utils/grid";

/**
 * 该组件是一个拖拽的上下文环境，统一封装各种事件处理逻辑
 */

export default function DndWrapper({
	children,
	scale = 1,
}: {
	children: React.ReactNode;
	scale?: number;
}) {
	const schemaStore = useSchemaStore();
	// 记录当前处于拖拽中的元素 id，用于在 DragOverlay 中渲染预览内容
	const [activeId, setActiveId] = useState<string | null>(null);
	const zoom = scale && scale > 0 ? scale : 1;

	// 拖拽开始事件处理
	const handleDragStart = (event: DragStartEvent) => {
		// TODO: 需要新增组件config，拖拽开始时，深拷贝一份拖拽组件对应config，在useDraggable中注册数据
		// 目前仅做调试输出，真正的实例 id 在拖拽结束时统一生成，保证「每次成功拖拽一个新实例就得到一个全新的 id」
		console.log("DragStartEvent:", event);
		setActiveId(event.active.id as string);
	};

	// 拖拽结束事件处理
	const handleDragEnd = (event: DragEndEvent) => {
		console.log("DragEndEvent:", event);
		setActiveId(null);
		// 拖拽结束时，更新组件树结构，更新组件的默认位置配置
		const dropItemId = event.over?.id;
		if (!dropItemId) return;

		// 根据拖拽源的 id 获取对应组件的基础配置（类型信息等）
		const newConfig = getNewComponentConfig(event.active.id as any);

		// ===== 计算新组件在父容器中的实际落点坐标 =====
		// 利用 dnd-kit 提供的 rect 信息：
		// - active.rect.current.translated：拖拽结束时，拖拽源在视口中的最终位置
		// - over.rect：当前命中的可放置区域在视口中的位置
		// 通过两者相减，得到组件在父容器内部的相对 left / top

		// 获取画布的滚动信息
		const canvas = document.getElementById("canvas");
		const scrollLeft = canvas?.scrollLeft ?? 0;
		const scrollTop = canvas?.scrollTop ?? 0;

		// 拖拽元素的目标容器相对于浏览器视口左上角的位置
		const overData = event.over?.data?.current as {
			getBoundingClientRect?: () => DOMRect | undefined;
		};
		const overRect = overData?.getBoundingClientRect?.() ?? event.over?.rect;

		// 放置的目标元素相对于浏览器视口左上角的相对位置
		const activeRect = event.active.rect.current?.translated;

		if (activeRect && overRect) {
			// 缩放后需要把落点还原为原始坐标系
			// activeRect.left/top - overRect.left/top: 拖拽元素相对于容器左上角的位置
			// 再加上滚动的距离，除以放大倍数，还原基于屏幕的1:1正常比例
			const offsetLeft = (activeRect.left - overRect.left + scrollLeft) / zoom;
			const offsetTop = (activeRect.top - overRect.top + scrollTop) / zoom;

			// 使用页面配置的网格尺寸做吸附：取最近网格点
			const gridSize = normalizeGridSize(schemaStore.schema?.settings?.gridSize);
			const snappedLeft = snapToGrid(offsetLeft, gridSize).value;
			const snappedTop = snapToGrid(offsetTop, gridSize).value;

			const nextStyle: any = newConfig.style ?? {};
			nextStyle.left = snappedLeft;
			nextStyle.top = snappedTop;
			newConfig.style = nextStyle;
		}

		// 这里为「实际落下的组件实例」生成一个全新的 id，
		// 不依赖 DraggableItem 中的状态，保证每一次成功拖拽得到的实例 id 都唯一
		newConfig.id = nanoid();
		schemaStore.addItem(dropItemId.toString(), newConfig);
	};

	// 拖拽被取消（例如 ESC 或拖拽到无效区域）时重置状态
	const handleDragCancel = () => {
		setActiveId(null);
	};

	return (
		<DndContext
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel}
		>
			{children}
			{/* 全局拖拽浮层，保证拖拽预览始终在画布上层显示 */}
			<DragOverlay>
				{activeId && (
					<div
						style={{
							zIndex: 9999,
							pointerEvents: "none",
						}}
					>
						{/* TODO: 此处可根据 activeId 渲染对应组件的真实预览内容 */}
						{activeId}
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
