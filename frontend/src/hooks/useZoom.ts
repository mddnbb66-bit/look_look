import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
/**
 * 缩放 Hook 入参
 * - canvasSize: 画布原始尺寸（宽高），用于计算缩放后尺寸
 * - viewportRef: 承载画布的可滚动容器 ref，基于其 clientWidth/clientHeight 计算自适应比例
 * - resetOnCanvasSizeChange: 画布宽高变更时是否重置为自适应（默认 true）
 * - minScale/maxScale: 自适应比例上下限，避免过小/过大导致不可用
 */

interface ZoomOptions {
	canvasSize: { width: number; height: number } | null; // 设计画布原始尺寸，如 1920×1080
	viewportRef: React.RefObject<HTMLElement | null>; // 可滚动容器的 ref，用来量"屏幕"多大	「一个装着 HTML 元素的 ref 对象」
	resetOnCanvasSizeChange?: boolean; // 画布尺寸变了要不要重置回自适应，默认 true
	minScale?: number; // 缩放下限，默认 0.1
	maxScale?: number; // 缩放上限，默认 1.5
	canvasRef?: React.RefObject<HTMLElement | null>; // 编辑器传入真实画布，用来换算观察中心
	viewKey?: string; // 项目身份变化后，不允许返回上一个项目的观察位置
}
// 你现在看着的画布位置
interface Point {
	x: number;
	y: number;
}
interface SavedView {
	scale: number;
	center: Point;
}

//限制缩放比例
const clamp = (value: number, min: number, max: number) => {
	if (value < min) return min;
	if (value > max) return max;
	return value;
};
export const useZoom = ({
	canvasSize,
	viewportRef,
	resetOnCanvasSizeChange = true,
	minScale = 0.1,
	maxScale = 1.5,
	canvasRef,
	viewKey,
}: ZoomOptions) => {
	const [autoFit, setAutoFit] = useState(true); //为true代表总览倍数 自适应模式开关
	const [manualScale, setManualScale] = useState(1); //人工调整
	const [overViewScale, setOverViewScale] = useState(1); //总览倍率
	const [savedView, setSavedView] = useState<SavedView | null>(null);
	const previousIdentity = useRef<{ viewKey?: string; width?: number; height?: number } | null>(null);
	useLayoutEffect(() => {
		const next = { viewKey, width: canvasSize?.width, height: canvasSize?.height };
		const prev = previousIdentity.current;
		const projectChanged = prev !== null && prev.viewKey !== viewKey;
		const sizeChanged = !prev || prev.width !== next.width || prev.height !== next.height;
		previousIdentity.current = next;
		if (!projectChanged && !sizeChanged) return;
		setSavedView(null);
		if (projectChanged || !canvasSize || (resetOnCanvasSizeChange && sizeChanged)) {
			setAutoFit(true);
			setManualScale(1);
			if (!canvasSize) setOverViewScale(1);
			viewportRef.current?.scrollTo(0, 0);
		}
	}, [viewKey, canvasSize?.width, canvasSize?.height, resetOnCanvasSizeChange, viewportRef]);
	// “容器大小变化时计算自适应（总览）比例
	useEffect(() => {
		//先保存元素在判断非空
		if (!canvasSize || !viewportRef.current) return;
		//计算总览的函数
		const computeOverViewScale = () => {
			const scale = Math.min(
				viewportRef.current!.clientHeight / canvasSize.height,
				viewportRef.current!.clientWidth / canvasSize.width
			);
			setOverViewScale(Number(clamp(scale, minScale, maxScale).toFixed(3)));
		};
		computeOverViewScale();
		//响应式处理
		// 工作区大小变化:左右面板展开、收起或调整宽度；父布局变化；工作区自身宽高改变
		// ResizeObserver：浏览器原生 API，专门监听某个 DOM 元素的尺寸变化
		const resizeObserver = new ResizeObserver(computeOverViewScale);
		resizeObserver.observe(viewportRef.current);
		// 浏览器窗口大小变化 :拖动浏览器窗口边缘、最大化或还原、停靠开发者工具挤占页面空间
		window.addEventListener("resize", computeOverViewScale);
		return () => {
			resizeObserver.disconnect(); //停止观察，否则组件没了还在监听，内存泄漏
			window.removeEventListener("resize", computeOverViewScale); //同理，而且必须传同一个函数引用才能解绑成功
		};
	}, [canvasSize, viewportRef, minScale, maxScale]);
	//缩放比例和缩放占位区的缩放宽高
	const scale = autoFit ? overViewScale : manualScale;
	const scaledWidth = canvasSize ? canvasSize.width * scale : 0;
	const scaledHeight = canvasSize ? canvasSize.height * scale : 0;
	function getCanvasOffset(viewport: HTMLElement): Point {
		const canvas = canvasRef?.current;
		if (!canvas) return { x: 0, y: 0 };
		const viewportRect = viewport.getBoundingClientRect();
		const canvasRect = canvas.getBoundingClientRect();
		return {
			x: canvasRect.left - viewportRect.left - viewport.clientLeft + viewport.scrollLeft,
			y: canvasRect.top - viewportRect.top - viewport.clientTop + viewport.scrollTop,
		};
	}
	//只计算视口正中心对应的原始画布坐标
	function getCenter(viewport: HTMLElement) {
		const offset = getCanvasOffset(viewport);
		const x = (viewport.scrollLeft + viewport.clientWidth / 2 - offset.x) / scale; //前者滚动条的距离后者是视口宽度的一半 加起来除以scale变成原始坐标
		const y = (viewport.scrollTop + viewport.clientHeight / 2 - offset.y) / scale;
		return { x: x, y: y };
	}
	//改变滚动条:根据倍率，再把画布上的 P 点(原始画布里面的点)放到屏幕正中。
	function changeScroll(
		viewport: HTMLElement,
		nextScale: number,
		center: { x: number; y: number }
	) {
		flushSync(() => {
			setManualScale(nextScale);
			setAutoFit(false);
		});

		const offset = getCanvasOffset(viewport);
		viewport.scrollLeft = offset.x + center.x * nextScale - viewport.clientWidth / 2;
		viewport.scrollTop = offset.y + center.y * nextScale - viewport.clientHeight / 2;
	}
	//处理加减,加的时候，
	function handleScaleChange(value: number) {
		setSavedView(null);
		const nextScale = Number(clamp(value, minScale, maxScale).toFixed(2));
		setManualScale(nextScale);
		setAutoFit(false);
	}
	//切换函数
	function handleSwitchOverview() {
		if (!viewportRef.current) return;
		if (savedView) {
			changeScroll(viewportRef.current, savedView.scale, savedView.center);
			setSavedView(null); //清空记录，以供下次
		} else if (!autoFit) {
			//当前为手动模式，所以添加
			const viewport = viewportRef.current;
			const center = getCenter(viewport);
			flushSync(() => {
				setSavedView({ scale: scale, center });
				setAutoFit(true);
			});
			viewport.scrollLeft = 0;
			viewport.scrollTop = 0;
		}
	}
	//处理重置
	function handleResetScale() {
		flushSync(() => {
			setSavedView(null);
			setManualScale(1);
			setAutoFit(true);
		});
		viewportRef.current?.scrollTo(0, 0);
	}
	return {
		autoFit,
		overViewScale,
		manualScale,
		scale,
		scaledWidth,
		scaledHeight,
		savedView,
		setAutoFit,
		handleScaleChange,
		handleResetScale,
		handleSwitchOverview,
	};
};
