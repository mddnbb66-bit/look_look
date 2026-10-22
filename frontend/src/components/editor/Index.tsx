import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import SidebarMenu from "@/components/panels/component-panel/SidebarMenu";
import DndWrapper from "@/core/dnd-kit/DndWrapper";
import DroppableItem from "@/core/dnd-kit/DroppableItem";
import Renderer from "@/core/renderer/Renderer";
import CanvasEmpty from "./CanvasEmpty";
import PropertyPanel from "@/components/panels/property-panel/Index";
import { useSchemaStore } from "@/store/schema-store";
import { useShallow } from "zustand/shallow";
import Toolbar from "./Toolbar";
import { getPageById } from "@/api/page";
import { useZoom } from "@/hooks/useZoom";
import { Ruler, RULER_THICKNESS } from "@/components/editor/ruler/Ruler";
import { GuideLayer } from "@/components/editor/ruler/GuideLayer";
import { Minus, Plus, Maximize, RotateCcw } from "lucide-react";
//提取数字的函数
const toNumber = (value: number | string | undefined, defaultNum: number) => {
	if (typeof value === "number") return value;
	//尝试转换
	const parsed = Number(value);
	//看看类型是number 以及值不能是 NaN / Infinity
	return Number.isFinite(parsed) ? parsed : defaultNum;
};

export default function Index() {
	const { id } = useParams<{ id: string }>(); //从url解构出项目传入的项目id
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [pageId, setPageId] = useState<string | null>(null);
	const [refreshFlag, setRefreshFlag] = useState(0); //重试按钮用的，人为制造一个变化。refreshFlag 就是这个「变化源」：
	const viewportRef = useRef<HTMLDivElement | null>(null); // 外层可视工作区
	const canvasRef = useRef<HTMLDivElement | null>(null); // 内层画布（不含缩放）
	const [canvasSize, setCanvasSize] = useState<{ width: number; height: number } | null>(null); //设计画布的宽高
	const [scroll, setScroll] = useState({ left: 0, top: 0 }); //滚动位置状态

	const { schema, setSchema } = useSchemaStore(
		useShallow((state) => ({ schema: state.schema, setSchema: state.setSchema })) //schema 是描述这个页面的数据对象，不是那块界面本身
	);
	const {
		autoFit,
		canReturnToView,
		scale,
		scaledWidth,
		scaledHeight,
		handleToggleOverview,
		handleScaleChange,
		handleResetScale,
	} = useZoom({
		canvasSize,
		viewportRef,
		canvasRef,
		viewKey: id,
		resetOnCanvasSizeChange: true,
	});
	//  请求A返回 → 读 cancelled₁ → true  → return，丢弃 ✅编辑器页：读取 URL 的 ID → 请求这个项目的详情
	useEffect(() => {
		let cancelled = false;
		const getPageDetail = async () => {
			if (!id) {
				setSchema(null); //清除旧页面数据
				setPageId(null);
				setError("未找到页面标识");
				setLoading(false);
				return;
			}
			setLoading(true);
			setError("");
			setSchema(null);
			try {
				const resp = await getPageById(id);
				const { code, message, data } = (resp as any) || {};
				if (code !== undefined && code !== 0) throw new Error(message || "获取页面失败");
				if (!data?.schema) throw new Error("页面数据为空");
				if (cancelled) return;
				setSchema(data.schema);
				setPageId(data.pageId || id);
			} catch (err: any) {
				if (cancelled) return;
				setError(err?.message || "加载失败");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		getPageDetail();
		return () => {
			cancelled = true;
		};
	}, [id, refreshFlag, setSchema]);
	//Schema 变化 → 读取宽高 → 和旧尺寸比较 → 不同才更新画布尺寸。
	//注意：它只负责同步尺寸
	useEffect(() => {
		if (!schema) {
			setCanvasSize(null);
			return;
		}
		const width = toNumber(schema.settings?.width, 1920);
		const height = toNumber(schema.settings?.height, 1080);
		setCanvasSize((prev) => {
			// 里的 prev 是上一次的 canvasSize
			if (prev && prev.width === width && prev.height === height) return prev;
			return { width, height };
		});
	}, [schema]);

	const isCanvasEmpty = !schema?.children || schema.children.length === 0;
	//“监听画布滚动”
	//“拿到 scrollLeft 和 scrollTop”
	//“更新 scroll 状态，供 ruler / 参考线同步使用”
	const handleScroll = () => {
		const node = viewportRef.current;
		// console.log(node);
		if (!node) return; //先确认对象/节点存在 在读取
		setScroll({ left: node.scrollLeft, top: node.scrollTop });
	};
	const rulerCanvasSize = useMemo(() => {
		if (!schema) return null;
		return {
			width: toNumber(schema.settings?.width, 1920),
			height: toNumber(schema.settings?.height, 1080),
		};
	}, [schema]);

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-50">
				<div className="flex flex-col items-center gap-3 animate-fade-in">
					<div className="h-8 w-8 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
					<span className="text-sm text-slate-400">正在加载页面...</span>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex h-screen items-center justify-center bg-slate-50">
				<div className="vc-card p-8 max-w-sm text-center space-y-4 animate-fade-in">
					<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-red-500">
						<svg
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<circle cx="12" cy="12" r="10" />
							<line x1="15" y1="9" x2="9" y2="15" />
							<line x1="9" y1="9" x2="15" y2="15" />
						</svg>
					</div>
					<div className="text-base font-semibold text-slate-800">页面加载失败</div>
					<div className="text-sm text-slate-500">{error}</div>
					<div className="flex justify-center gap-3">
						<button
							className="vc-btn text-sm"
							onClick={() => setRefreshFlag((v) => v + 1)}
						>
							重试
						</button>
						<button
							className="vc-btn-ghost text-sm"
							onClick={() => navigate("/projects")}
						>
							返回项目列表
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<>
			{/* 下面是个三栏2行grid布局 */}
			{/* grid-cols-custom：400px 1fr 350px; 三栏 */}
			{/* grid-rows-header：56px 1fr */}
			<div className="grid grid-cols-custom grid-rows-header h-[100vh] bg-slate-100/60">
				{/* 工具栏 */}
				<div className="row-start-1 row-end-2 col-start-1 col-end-4">
					<Toolbar pageId={pageId} onPageIdChange={setPageId} />
					{/* //横跨三列、独占第一行 */}
				</div>
				<DndWrapper scale={scale}>
					{/* //下面是组件栏 */}
					<SidebarMenu className="border-r border-slate-200 bg-white" />
					{/* 下面是中间栏 */}
					<div className="flex min-h-0 min-w-0 flex-col">
						{/* 缩放栏 */}
						<div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5 text-xs">
							<div className="flex items-center gap-3 text-slate-500">
								<span>
									画布 {canvasSize?.width ?? "--"} × {canvasSize?.height ?? "--"}
								</span>
								<span className="text-slate-400">{Math.round(scale * 100)}%</span>
							</div>
							<div className="flex items-center gap-1.5">
								{/* 处理缩放 */}
								<button
									className={`rounded-md border p-1 transition-all ${autoFit ? "border-brand-200 text-brand-500 bg-brand-50" : "border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-500"}`}
									title={
										canReturnToView
											? "返回上次视图（倍率和位置）"
											: "显示全画布"
									}
									aria-label={canReturnToView ? "返回上次视图" : "显示全画布"}
									onClick={handleToggleOverview}
								>
									<Maximize className="h-3.5 w-3.5" />
								</button>
								<button
									className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all"
									onClick={() => handleScaleChange(scale - 0.1)}
								>
									<Minus className="h-3.5 w-3.5" />
								</button>
								<span className="w-12 text-center text-xs text-slate-500">
									{Math.round(scale * 100)}%
								</span>
								<button
									className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all"
									onClick={() => handleScaleChange(scale + 0.1)}
								>
									<Plus className="h-3.5 w-3.5" />
								</button>
								<button
									className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all ml-0.5"
									onClick={handleResetScale}
								>
									<RotateCcw className="h-3.5 w-3.5" />
								</button>
							</div>
						</div>
						{/* 标尺＋灰色工作区容器 */}
						<div className="relative flex min-h-0 flex-1 overflow-hidden">
							{/* 左上角标尺交叉处的小方块 */}
							<Ruler
								orientation="x"
								length={rulerCanvasSize?.width ?? 0}
								scale={scale}
								scroll={scroll.left}
							/>
							{/* 纵向标尺 */}
							<Ruler
								orientation="y"
								length={rulerCanvasSize?.height ?? 0}
								scale={scale}
								scroll={scroll.top}
							/>

							{/* 这个层是中间层也是工作区外框是让出标尺位置的包装层 */}
							<div className="ml-[28px] mt-[28px] flex-1 overflow-hidden">
								<DroppableItem
									id={schema!.id}
									style={{ minHeight: "0", minWidth: "0" }}
								>
									{/* //下面是灰色工作区 不含标尺*/}
									<div
										ref={viewportRef}
										id="viewport"
										className=" h-full w-full  overflow-auto bg-slate-100/80"
										// 画布底纹
										style={{
											backgroundImage:
												"radial-gradient(circle, #e2e8f0 0.5px, transparent 0.5px)",
											backgroundSize: "16px 16px",
										}}
										onScroll={handleScroll}
									>
										{/* 下面是缩放占位层 根据外层工作区和scale得到宽高 */}
										<div
											className="relative"
											style={{
												width: scaledWidth,
												height: scaledHeight,
												minWidth: 320,
												minHeight: 180,
											}}
										>
											{/* 下面div是真实画布内容 */}
											<div
												ref={canvasRef}
												id="canvas"
												data-canvas-content="true"
												style={{
													width: canvasSize?.width ?? 0,
													height: canvasSize?.height ?? 0,
													transform: `scale(${scale})`,
													transformOrigin: "top left",
													position: "absolute",
													top: 0,
													left: 0,
												}}
											>
												{isCanvasEmpty && <CanvasEmpty />}
												<Renderer schema={schema!} scale={scale} />
											</div>
											{/* 辅助线层 */}
											<GuideLayer
												scale={scale}
												width={scaledWidth}
												height={scaledHeight}
											/>
										</div>
									</div>
								</DroppableItem>
							</div>
						</div>
					</div>
				</DndWrapper>
				{/* 组件属性、页面配置、AI 对话 */}
				<div className="h-full overflow-hidden border-l border-slate-200 bg-white">
					<PropertyPanel />
				</div>
			</div>
		</>
	);
}

// 整个编辑器
// ├─ 顶部工具栏：VC、编辑器、ID、保存、预览
// ├─ 左侧 SidebarMenu：分类菜单＋组件卡片
// ├─ 中间编辑区域
// │  ├─ 缩放栏：画布尺寸、40%、缩放按钮
// │  └─ 标尺与工作区
// │     ├─ 左上角小方块
// │     ├─ 横向标尺
// │     ├─ 纵向标尺
// │     └─ 可滚动工作区
// │        └─ 缩放占位层
// │           ├─ 实际画布内容层
// │           └─ 辅助线层
// └─ 右侧 PropertyPanel：组件属性、页面配置、AI 对话
