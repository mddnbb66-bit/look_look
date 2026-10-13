import { useEffect, useMemo, useRef, useState } from "react";

/**
 * 缩放 Hook 入参
 * - canvasSize: 画布原始尺寸（宽高），用于计算缩放后尺寸
 * - viewportRef: 承载画布的可滚动容器 ref，基于其 clientWidth/clientHeight 计算自适应比例
 * - resetOnCanvasSizeChange: 画布宽高变更时是否重置为自适应（默认 true）
 * - minScale/maxScale: 自适应比例上下限，避免过小/过大导致不可用
 */
interface ZoomOptions {
	canvasSize: { width: number; height: number } | null; // 设计画布原始尺寸，如 1920×1080
	viewportRef: React.RefObject<HTMLElement>; // 可滚动容器的 ref，用来量"屏幕"多大
	resetOnCanvasSizeChange?: boolean; // 画布尺寸变了要不要重置回自适应，默认 true
	minScale?: number; // 缩放下限，默认 0.1
	maxScale?: number; // 缩放上限，默认 1.5
}

// 简单数值截断，限定缩放范围
// 人话：小于最小取最小，大于最大取最大，都不是就正常，取value
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * 复用预览/编辑的缩放逻辑：自适应计算、手动缩放、重置
 */
// 接受一个对象，然后一个大雷霆解构
export function useZoom({
	canvasSize,
	viewportRef,
	resetOnCanvasSizeChange = true,
	minScale = 0.1,
	maxScale = 1.5,
}: ZoomOptions) {
	const [autoFit, setAutoFit] = useState(true); // 是否处于"自适应"模式
	const [manualZoom, setManualZoom] = useState(1); // 手动缩放倍率
	const [fitScale, setFitScale] = useState(1); // 自适应算出来的倍率
	const prevCanvasSizeRef = useRef<{ width: number; height: number } | null>(null); // 上一次的画布尺寸（不触发渲染）

	// 容器大小变化时计算自适应比例
	useEffect(() => {
		if (!canvasSize) return;
		const node = viewportRef.current;
		if (!node) return;

		const computeFitScale = () => {
			const { clientWidth, clientHeight } = node;
			if (!clientWidth || !clientHeight) return;

			//  ================== 自适应尺寸计算说明 ================== //
			//  1. clientWidth / clientHeight : 表示的是视口的宽度和高度，可以理解为电视机屏幕，尺寸是固定的
			//  2. canvasSize.width / height : 表示的是实际的大屏尺寸，比如1920 * 1080
			//  3. ∵ canvasSize.width * fitScale = clientWidth
			//  4. ∴ scale = Math.min(clientWidth / canvasSize.width, clientHeight / canvasSize.height), 取最小值是为了让整个画布都在电视机中
			const scale = Math.min(
				clientWidth / canvasSize.width,
				clientHeight / canvasSize.height
			);
			setFitScale(Number(clamp(scale, minScale, maxScale).toFixed(3)));
		};

		computeFitScale();

		// 容器大小变化
		const resizeObserver = new ResizeObserver(() => computeFitScale());
		resizeObserver.observe(node);
		// 浏览器窗口大小变化
		window.addEventListener("resize", computeFitScale);

		return () => {
			resizeObserver.disconnect();
			window.removeEventListener("resize", computeFitScale);
		};
	}, [canvasSize, viewportRef, minScale, maxScale]);

	// 设计画布尺寸变化时（宽/高变化）才重置自适应，避免选中等操作重置
	useEffect(() => {
		if (!canvasSize) {
			prevCanvasSizeRef.current = null;
			setAutoFit(true);
			setManualZoom(1);
			setFitScale(1);
			return;
		}
		const prev = prevCanvasSizeRef.current;

		// =========================== 重置自适应的条件 =============================
		// 1. resetOnCanvasSizeChange为true，也就是手动设置了允许在设计画布尺寸变化时重置自适应
		// 2. !prev：当初次渲染时，prev为null，直接自适应
		// 3. prev.width !== canvasSize.width || prev.height !== canvasSize.height：前后设计画布尺寸不一致，说明变化了，直接自适应
		if (
			resetOnCanvasSizeChange &&
			(!prev || prev.width !== canvasSize.width || prev.height !== canvasSize.height)
		) {
			setAutoFit(true);
			setManualZoom(1);
		}
		prevCanvasSizeRef.current = canvasSize;
	}, [canvasSize, resetOnCanvasSizeChange]);

	// 在hook内部计算出缩放比例以及缩放后的宽高
	const scale = useMemo(() => (autoFit ? fitScale : manualZoom), [autoFit, fitScale, manualZoom]);
	const scaledWidth = useMemo(
		() => (canvasSize ? canvasSize.width * scale : 0),
		[canvasSize, scale]
	);
	const scaledHeight = useMemo(
		() => (canvasSize ? canvasSize.height * scale : 0),
		[canvasSize, scale]
	);

	const handleZoomChange = (value: number) => {
		setManualZoom(Number(clamp(value, 0.1, 1.5).toFixed(2)));
		setAutoFit(false);
	};

	const handleResetZoom = () => {
		setManualZoom(1);
		setAutoFit(true);
	};

	/**
	 * 返回值说明：
	 * - autoFit: 当前是否处于自适应模式
	 * - manualZoom: 手动缩放倍率（非自适应模式生效）
	 * - fitScale: 自适应计算得到的倍率
	 * - scale: 实际使用倍率（autoFit?fitScale:manualZoom）
	 * - scaledWidth/scaledHeight: 画布在当前倍率下的外层容器尺寸，可用于设置包裹节点宽高
	 * - setAutoFit/handleZoomChange/handleResetZoom: 控制缩放状态的操作函数
	 */
	return {
		autoFit,
		manualZoom,
		fitScale,
		scale,
		scaledWidth,
		scaledHeight,
		setAutoFit,
		handleZoomChange,
		handleResetZoom,
	};
}
