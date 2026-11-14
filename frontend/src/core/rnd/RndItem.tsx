import { Rnd } from "react-rnd";
import React, { useCallback, useEffect, useRef } from "react";
import type { ComponentNodeType } from "@/core/schema/ownType";
import { useSchemaStore } from "@/store/schema-store";
import { useGuideStore } from "@/store/guide-store";
import { useShallow } from "zustand/shallow";
import { normalizeGridSize, snapToGrid } from "@/core/utils/grid";
import SelectionOverlay from "./SelectionOverlay";
import AiEditInput from "./AiEditInput";
import type { DraggableData, ResizableDelta, Position } from "react-rnd";
import type { DraggableEvent } from "react-draggable";
interface RndItemProps {
	// 当前渲染的节点数据
	node: ComponentNodeType;
	// 真实业务组件（文本、容器等）
	children: React.ReactNode;
	// 画布缩放倍率，传给 Rnd 以修正拖拽/缩放坐标
	scale?: number;
}

/**
 * 基于 react-rnd 的可拖拽 / 可缩放包装组件
 * - 负责把 schema 中的 style 同步到画布上的绝对定位
 * - 在拖拽 / 缩放结束时把最新的位置和尺寸回写到 schema-store
 * - 同时承载「选中态」的点击事件，选中态 UI 委托给 SelectionOverlay 和 AiEditInput
 */
export default function RndItem({ node, children, scale = 1 }: RndItemProps) {
	const { updateItem, removeItem, selectedId, setSelectedId, gridSize } = useSchemaStore(
		useShallow((state) => ({
			updateItem: state.updateItem,
			removeItem: state.removeItem,
			selectedId: state.selectedId,
			setSelectedId: state.setSelectedId,
			gridSize: state.schema?.settings?.gridSize,
		}))
	);
	const { setActiveSnaps } = useGuideStore(
		useShallow((state) => ({
			setActiveSnaps: state.setActiveSnaps,
		}))
	);

	// 当前页面生效的网格尺寸（兜底默认值）
	const resolvedGridSize = normalizeGridSize(gridSize);

	// 兜底的样式，防御 style 为空的情况，避免 Rnd 报错
	const style = node.style ?? {
		top: 0,
		left: 0,
		width: 200,
		height: 50,
		zIndex: 1,
	};

	//当前正在渲染的组件，是不是用户当前选中的组件？
	const isSelected = selectedId === node.id;
	// 当组件靠近画布顶部时，标签会被遮住，需要翻转到下方显示
	const isNearTop = style.top < 20;

	// raf 防抖，避免拖拽时频繁触发高亮 setState
	const highlightRaf = useRef<number>();
	useEffect(() => {
		return () => {
			if (highlightRaf.current) {
				cancelAnimationFrame(highlightRaf.current);
			}
		};
	}, []);

	const updateSnapsSafely = useCallback(
		(snaps: { orientation: "x" | "y"; value: number }[] = []) => {
			if (highlightRaf.current) {
				cancelAnimationFrame(highlightRaf.current);
			}
			highlightRaf.current = requestAnimationFrame(() => {
				setActiveSnaps(snaps);
			});
		},
		[setActiveSnaps]
	);

	// ===== 回调函数：从 Rnd 属性中提取 =====

	/** 拖拽过程中仅处理参考线高亮 */
	const handleDrag = useCallback(
		(_e: DraggableEvent, data: DraggableData) => {
			const gridXValue = snapToGrid(data.x, resolvedGridSize).originPosition;
			const gridYValue = snapToGrid(data.y, resolvedGridSize).originPosition;
			updateSnapsSafely([
				{ orientation: "x", value: gridXValue },
				{ orientation: "y", value: gridYValue },
			]);
		},
		[resolvedGridSize, updateSnapsSafely]
	);

	/** 拖拽结束时同步最新坐标到 schema */
	/**
	 * @param data一般是这样{
  node,    // 被拖拽的 DOM 元素
  x,       // 当前横坐标
  y,       // 当前纵坐标
  deltaX,  // 本次横向移动距离
  deltaY,  // 本次纵向移动距离
  lastX,   // 上一次横坐标
  lastY    // 上一次纵坐标
}
	 */
	const handleDragStop = useCallback(
		(_e: DraggableEvent, data: DraggableData) => {
			const snappedLeft = snapToGrid(data.x, resolvedGridSize).originPosition;
			const snappedTop = snapToGrid(data.y, resolvedGridSize).originPosition;
			updateSnapsSafely([]);
			updateItem(node.id, {
				style: { ...style, left: snappedLeft, top: snappedTop },
			} as Partial<ComponentNodeType>);
		},
		[resolvedGridSize, updateSnapsSafely, updateItem, node.id, style]
	);

	/** 单个缩放结束时同步最新尺寸与坐标到 schema */
	// 用户拖动组件边缘
	//         ↓
	// Rnd 改变组件大小
	//         ↓
	// 用户松开鼠标
	//         ↓
	// 触发 handleResizeStop
	//         ↓
	// 读取新宽高和位置
	//         ↓
	// 吸附到网格
	//         ↓
	// 保存到 schema
	// 不是为了能缩放
	// 缩放结束
	// → 获取最终尺寸
	// → 对齐网格
	// → 写回 schema
	// → 保证数据、保存结果和画面一致
	const handleResizeStop = useCallback(
		(
			_e: MouseEvent | TouchEvent,
			_direction: string,
			ref: HTMLElement, //当前被缩放的 HTML 元素，用.可以获得获取缩放后的尺寸，就offset
			_delta: ResizableDelta, //表示这次缩放尺寸变化了多少，是怎量
			position: Position //缩放后的坐标，用来取 x、y
		) => {
			const snappedWidth = snapToGrid(ref.offsetWidth, resolvedGridSize).originPosition;
			const snappedHeight = snapToGrid(ref.offsetHeight, resolvedGridSize).originPosition;
			//从左上角开缩放，的处理
			const snappedLeft = snapToGrid(position.x, resolvedGridSize).originPosition;
			const snappedTop = snapToGrid(position.y, resolvedGridSize).originPosition;
			updateSnapsSafely([]);
			updateItem(node.id, {
				style: {
					...style,
					width: snappedWidth,
					height: snappedHeight,
					left: snappedLeft,
					top: snappedTop,
				},
			} as Partial<ComponentNodeType>);
		},
		[resolvedGridSize, updateSnapsSafely, updateItem, node.id, style]
	);
	// useCallback		决定函数是否复用
	// 第一次渲染：创建 handleClick
	// 后续渲染时：
	// setSelectedId 和 node.id 没变：复用旧函数
	// 任意一个变了：重新创建函数
	/** 删除当前组件 */
	/** 点击选中当前组件 */
	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			setSelectedId(node.id);
		},
		[setSelectedId, node.id]
	);

	const handleDelete = useCallback(() => {
		removeItem(node.id);
		if (isSelected) {
			setSelectedId(null);
		}
	}, [removeItem, node.id, isSelected, setSelectedId]);

	/** 取消选中 */
	const handleDeselect = useCallback(() => {
		setSelectedId(null);
	}, [setSelectedId]);

	return (
		<Rnd
			size={{ width: style.width, height: style.height }}
			position={{ x: style.left, y: style.top }}
			bounds="parent"
			scale={scale}
			disableDragging={node.id !== selectedId} //没选中的组件禁止拖动。
			enableResizing={node.id === selectedId} //只有选中的组件允许缩放。
			style={{ zIndex: style.zIndex }}
			onDrag={handleDrag} //组件正在移动时持续触发
			onDragStop={handleDragStop} //组件移动结束时触发
			onResizeStop={handleResizeStop} //组件缩放结束时触发
		>
			{/* 内层容器负责点击选中、高亮边框和标签区域 */}
			<div
				style={{
					position: "relative",
					width: "100%",
					height: "100%",
					backgroundColor: style.backgroundColor,
				}}
				onClick={handleClick}
			>
				{isSelected && (
					<SelectionOverlay
						name={node.name || node.type}
						isNearTop={isNearTop}
						onDelete={handleDelete}
						onDeselect={handleDeselect}
					/>
				)}

				{isSelected && <AiEditInput node={node} isNearTop={isNearTop} />}

				{children}
			</div>
		</Rnd>
	);
}

// relative 外层 div
// ├── SelectionOverlay
// │   ├── 边框 div：absolute
// │   ├── 名称 div：absolute
// │   └── 按钮 div：absolute
// ├── AiEditInput：取决于它自己的 CSS
// └── children：普通文档流元素
