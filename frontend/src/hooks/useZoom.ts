import { useEffect, useLayoutEffect, useRef, useState } from "react";

/**
 * 缩放 Hook 入参
 * - canvasSize: 画布原始尺寸（宽高），用于计算缩放后尺寸
 * - viewportRef: 承载画布的可滚动容器 ref，基于其 clientWidth/clientHeight 计算自适应比例
 * - resetOnCanvasSizeChange: 画布宽高变更时是否重置为自适应（默认 true）
 * - minScale/maxScale: 自适应比例上下限，避免过小/过大导致不可用
 */
interface ZoomOptions {
	canvasSize: { width: number; height: number } | null; // 设计画布原始尺寸，如 1920×1080
	viewportRef: React.RefObject<HTMLElement>; // 外层工作区引用，用来读取可视宽高
	resetOnCanvasSizeChange?: boolean; // 画布尺寸变了要不要重置回自适应，默认 true
	minScale?: number; // 缩放下限，默认 0.1
	maxScale?: number; // 缩放上限，默认 1.5
	canvasRef?: React.RefObject<HTMLElement>; // 编辑器传入真实画布，用来换算观察中心
	viewKey?: string; // 项目身份变化后，不允许返回上一个项目的观察位置
}

interface SavedView {
	scale: number;
	centerX: number; // 画布坐标，不是浏览器像素或滚动条数值
	centerY: number;
}

// 简单数值截断，限定缩放范围
// 人话：小于最小取最小，大于最大取最大，都不是就正常，取value
const clamp = (value: number, min: number, max: number) => {
	if (value < min) return min;
	if (value > max) return max;
	return value;
};
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
	canvasRef,
	viewKey,
}: ZoomOptions) {
	const [autoFit, setAutoFit] = useState(true); // 当前是否采用总览倍率的boolen
	const [manualScale, setManualScale] = useState(1); // 用户手动设置的倍率
	const [overViewScale, setOverViewScale] = useState(1); // 根据工作区计算出来的总览倍率
	const prevCanvasSizeRef = useRef<{ width: number; height: number } | null>(null); // 上一次的画布尺寸（不触发渲染）
	const [savedView, setSavedView] = useState<SavedView | null>(null); //存着上一次倍率和观察中心
	const pendingView = useRef<SavedView | "overview" | null>(null); //告诉程序：等布局更新后，要恢复哪个位置
	const [viewRequest, setViewRequest] = useState(0); //发起一次处理请求，即使倍率没变也能触发处理

	// 换项目或改变设计宽高后，旧坐标已经不可靠。只改名称不会清除记录。
	useLayoutEffect(() => {
		setSavedView(null);
		pendingView.current = null;
	}, [viewKey, canvasSize?.width, canvasSize?.height]);

	// 容器大小变化时计算自适应(总览)比例
	// useEffect 的返回值，在组件卸载或 effect 重新执行前调用
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

	// 设计画布尺寸变化时（宽/高变化）才重置自适应，避免选中等操作重置
	useEffect(() => {
		if (!canvasSize) {
			prevCanvasSizeRef.current = null;
			setAutoFit(true);
			setManualScale(1);
			setOverViewScale(1);
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
			setManualScale(1);
		}
		prevCanvasSizeRef.current = canvasSize;
	}, [canvasSize, resetOnCanvasSizeChange]);

	// 在hook内部计算出缩放比例以及缩放后的宽高
	const scale = autoFit ? overViewScale : manualScale; //缩放比例
	const scaledWidth = canvasSize ? canvasSize.width * scale : 0; //缩放宽也是工作区的宽
	const scaledHeight = canvasSize ? canvasSize.height * scale : 0; //缩放高也就是工作区的宽

	// 必须等 React 把新倍率和占位宽高写进 DOM，再恢复滚动位置。
	// 否则浏览器会用缩小后的滚动范围截断坐标，导致“倍率回来了，位置没回来”。
	useLayoutEffect(() => {
		const target = pendingView.current;
		const node = viewportRef.current;
		const canvas = canvasRef?.current;
		if (!target || !node || !canvas) return;
		pendingView.current = null;
		if (target === "overview") {
			node.scrollLeft = 0;
			node.scrollTop = 0;
			return;
		}
		const viewportRect = node.getBoundingClientRect();
		const canvasRect = canvas.getBoundingClientRect();
		// 将之前观察的画布点重新放在工作区中央。
		// 工作区变大/变小仍可使用；靠近边缘时由浏览器限制在合法滚动范围。
		node.scrollLeft +=
			canvasRect.left +
			target.centerX * scale -
			(viewportRect.left + node.clientLeft + node.clientWidth / 2);
		node.scrollTop +=
			canvasRect.top +
			target.centerY * scale -
			(viewportRect.top + node.clientTop + node.clientHeight / 2);
	}, [viewRequest, scale, viewportRef, canvasRef]);

	const handleToggleOverview = () => {
		const node = viewportRef.current;
		const canvas = canvasRef?.current;
		if (!canvasSize || !node || !canvas || scale <= 0) return;
		if (savedView) {
			// 第二次点击：恢复真实显示倍率及画布中的观察中心，然后消耗记录。
			pendingView.current = savedView;
			setManualScale(savedView.scale);
			setAutoFit(false);
			setSavedView(null);
		} else {
			// 已经处于总览且没有历史视图时，不凭空跳到100%。
			if (!autoFit) {
				const viewportRect = node.getBoundingClientRect();
				const canvasRect = canvas.getBoundingClientRect();
				setSavedView({
					scale,
					centerX:
						(viewportRect.left +
							node.clientLeft +
							node.clientWidth / 2 -
							canvasRect.left) /
						scale,
					centerY:
						(viewportRect.top +
							node.clientTop +
							node.clientHeight / 2 -
							canvasRect.top) /
						scale,
				});
			}
			pendingView.current = "overview";
			setAutoFit(true);
		}
		setViewRequest((value) => value + 1);
	};

	const handleScaleChange = (value: number) => {
		// 在总览中主动调倍率，表示开始新的观察，不再保留旧的返回记录。
		setSavedView(null);
		pendingView.current = null;
		setManualScale(Number(clamp(value, 0.1, 1.5).toFixed(2)));
		setAutoFit(false);
	};

	const handleResetScale = () => {
		setSavedView(null);
		pendingView.current = null;
		setManualScale(1);
		setAutoFit(true);
	};

	/**
	 * 返回值说明：
	 * - autoFit: 当前是否处于自适应模式
	 * - manualScale: 手动缩放倍率（非自适应模式生效）
	 * - overViewScale: 自适应计算得到的总览倍率
	 * - scale: 实际使用倍率（autoFit?overViewScale:manualScale）
	 * - scaledWidth/scaledHeight: 画布在当前倍率下的外层容器尺寸，可用于设置包裹节点宽高
	 * - setAutoFit/handleScaleChange/handleResetScale: 控制缩放状态的操作函数
	 */
	return {
		canReturnToView: savedView !== null,
		handleToggleOverview,
		autoFit,
		manualScale,
		overViewScale,
		scale,
		scaledWidth,
		scaledHeight,
		setAutoFit,
		handleScaleChange,
		handleResetScale,
	};
}
// 点击 +
//   ↓
// 算出58%
//   ↓
// 保存手动倍率，并切换到手动模式
//   ↓
// React重新渲染，scale变成58%
//   ↓
// 画布按58%显示

// 点击按钮：保存记录／切换倍率
//               ↓
// React 更新画布尺寸
//               ↓
// useLayoutEffect：恢复滚动位置

// 另一个记忆
// 画布设计尺寸 + 工作区可视尺寸
//              ↓
//        算出总览倍率 fitScale
//              ↓
// autoFit 决定采用哪一种倍率
//   true → fitScale
//   false → manualZoom
//              ↓
//       最终倍率 scale
//              ↓
// 设计宽高 × scale → 显示宽高
//              ↓
// 编辑页应用缩放，画布才真的变小或变大
