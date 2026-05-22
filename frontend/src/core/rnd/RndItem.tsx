import { Rnd } from "react-rnd";
import React, { useCallback, useEffect, useRef } from "react";
import type { ComponentNode } from "@/core/schema/basic";
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
	node: ComponentNode;
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
			const gridXValue = snapToGrid(data.x, resolvedGridSize).value;
			const gridYValue = snapToGrid(data.y, resolvedGridSize).value;
			updateSnapsSafely([
				{ orientation: "x", value: gridXValue },
				{ orientation: "y", value: gridYValue },
			]);
		},
		[resolvedGridSize, updateSnapsSafely]
	);

	/** 拖拽结束时同步最新坐标到 schema */
	const handleDragStop = useCallback(
		(_e: DraggableEvent, data: DraggableData) => {
			const snappedLeft = snapToGrid(data.x, resolvedGridSize).value;
			const snappedTop = snapToGrid(data.y, resolvedGridSize).value;
			updateSnapsSafely([]);
			updateItem(node.id, {
				style: { ...style, left: snappedLeft, top: snappedTop },
			} as Partial<ComponentNode>);
		},
		[resolvedGridSize, updateSnapsSafely, updateItem, node.id, style]
	);

	/** 缩放结束时同步最新尺寸与坐标到 schema */
	const handleResizeStop = useCallback(
		(
			_e: MouseEvent | TouchEvent,
			_direction: string,
			ref: HTMLElement,
			_delta: ResizableDelta,
			position: Position
		) => {
			const snappedWidth = snapToGrid(ref.offsetWidth, resolvedGridSize).value;
			const snappedHeight = snapToGrid(ref.offsetHeight, resolvedGridSize).value;
			const snappedLeft = snapToGrid(position.x, resolvedGridSize).value;
			const snappedTop = snapToGrid(position.y, resolvedGridSize).value;
			updateSnapsSafely([]);
			updateItem(node.id, {
				style: {
					...style,
					width: snappedWidth,
					height: snappedHeight,
					left: snappedLeft,
					top: snappedTop,
				},
			} as Partial<ComponentNode>);
		},
		[resolvedGridSize, updateSnapsSafely, updateItem, node.id, style]
	);

	/** 点击选中当前组件 */
	const handleClick = useCallback(
		(event: React.MouseEvent) => {
			event.stopPropagation();
			setSelectedId(node.id);
		},
		[setSelectedId, node.id]
	);

	/** 删除当前组件 */
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
			disableDragging={node.id !== selectedId}
			enableResizing={node.id === selectedId}
			style={{ zIndex: style.zIndex }}
			onDrag={handleDrag}
			onDragStop={handleDragStop}
			onResizeStop={handleResizeStop}
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
