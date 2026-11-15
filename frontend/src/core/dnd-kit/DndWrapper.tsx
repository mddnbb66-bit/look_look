/**
 * @param DragStartEvent 拖拽开始时的数据类型
 * @param DragEndEvent 	拖拽结束时的数据类型
 * @param DragOverlay 拖拽过程中的视觉预览
 * @param DndContext	拖拽系统的上下文容器，类似一个总控制器。
 */
import { DndContext, DragOverlay, type DragStartEvent, type DragEndEvent } from "@dnd-kit/core";
import { useState } from "react";
import { useSchemaStore } from "@/store/schema-store";
import { getNewComponentConfig } from "@/config";
import { nanoid } from "nanoid";
import { normalizeGridSize, snapToGrid } from "@/core/utils/grid";

/**
 * 该组件是一个拖拽的上下文环境，统一封装各种事件处理逻辑
 * 也就是处理拖完之后具体怎么处理
 */

export default function DndWrapper({
	children,
	scale = 1,
}: {
	children: React.ReactNode;
	scale?: number;
}) {
	const schemaStore = useSchemaStore();
	// 记录当前处于拖拽中的元素 type，用于在 DragOverlay 中渲染预览内容
	//就是被拖拽的那个组件的type
	const [activeType, setActiveType] = useState<string | null>(null);
	const zoom = scale && scale > 0 ? scale : 1;

	// 拖拽开始事件处理
	const handleDragStart = (event: DragStartEvent) => {
		// TODO: 需要新增组件config，拖拽开始时，深拷贝一份拖拽组件对应config，在useDraggable中注册数据
		// 目前仅做调试输出，真正的实例 id 在拖拽结束时统一生成，保证「每次成功拖拽一个新实例就得到一个全新的 id」
		console.log("DragStartEvent:", event);
		//这个id就是ComponentType，只是注册的时候必须写id
		//event.active    // 正在拖的那个来源的信息对象
		setActiveType(event.active.id as string);
	};

	// 拖拽结束事件处理
	const handleDragEnd = (event: DragEndEvent) => {
		console.log("DragEndEvent:", event);
		setActiveType(null);
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

		// 获取外层可视工作区的滚动信息
		const viewport = document.getElementById("viewport");
		const scrollLeft = viewport?.scrollLeft ?? 0;
		const scrollTop = viewport?.scrollTop ?? 0;

		// 拖拽元素的目标容器相对于浏览器视口左上角的位置
		const overPosition = event.over?.rect;

		// 放置的目标元素相对于浏览器视口左上角的相对位置
		const newNodePosition = event.active.rect.current?.translated;

		if (newNodePosition && overPosition) {
			// 缩放后需要把落点还原为原始坐标系
			// newNodePosition.left/top - overPosition.left/top: 拖拽元素相对于容器左上角的位置
			// 再加上滚动的距离，除以放大倍数，还原基于屏幕的1:1正常比例
			const offsetLeft = (newNodePosition.left - overPosition.left + scrollLeft) / zoom;
			const offsetTop = (newNodePosition.top - overPosition.top + scrollTop) / zoom;

			// 使用页面配置的网格尺寸做吸附：取最近网格点
			const gridSize = normalizeGridSize(schemaStore.schema?.settings?.gridSize);
			const snappedLeft = snapToGrid(offsetLeft, gridSize).originPosition;
			const snappedTop = snapToGrid(offsetTop, gridSize).originPosition;

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
		setActiveType(null);
	};
	// 	dnd-kit 处理取消操作
	//    ├─ 清理库内部的拖拽状态
	//    ├─ 让 useDraggable 的拖动位移恢复
	//    └─ 调用你提供的 handleDragCancel，通知你清理自己的状态

	return (
		// 拖拽系统的上下文容器，类似一个总控制器 监听拖拽开始 监听拖拽结束 监听拖拽取消 管理拖拽源和放置区域之间的关系 给内部的 useDraggable、useDroppable 提供环境
		<DndContext
			onDragStart={handleDragStart} //拖拽开始时触发这个回调 下面是结束的时候
			onDragEnd={handleDragEnd}
			onDragCancel={handleDragCancel} //拖拽取消时触发。比如拖到无效区域后取消
		>
			{children}
			{/* 全局拖拽浮层，保证拖拽预览始终在画布上层显示 */}
			<DragOverlay>
				{activeType && (
					// 拖拽时跟着鼠标走的小标签：深色底白字，显示正在拖的组件类型
					<div
						className="inline-flex h-7 items-center rounded-md bg-slate-900 px-2.5 text-xs font-medium text-white shadow-float"
						style={{
							zIndex: 9999,
							pointerEvents: "none",
						}}
					>
						{/* TODO: 此处可根据 activeType 渲染对应组件的真实预览内容 */}
						{activeType}
					</div>
				)}
			</DragOverlay>
		</DndContext>
	);
}
