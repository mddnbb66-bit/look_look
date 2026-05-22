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

const toNumber = (value: number | string | undefined, fallback: number) => {
	if (typeof value === "number") return value;
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export default function Index() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [pageId, setPageId] = useState<string | null>(null);
	const [refreshFlag, setRefreshFlag] = useState(0);
	const containerRef = useRef<HTMLDivElement | null>(null);
	const [viewport, setViewport] = useState<{ width: number; height: number } | null>(null);
	const [scroll, setScroll] = useState({ left: 0, top: 0 });

	const { schema, setSchema } = useSchemaStore(
		useShallow((state) => ({ schema: state.schema, setSchema: state.setSchema }))
	);
	const {
		autoFit,
		manualZoom,
		scale,
		scaledWidth,
		scaledHeight,
		setAutoFit,
		handleZoomChange,
		handleResetZoom,
	} = useZoom({
		viewport,
		containerRef,
		resetOnViewportChange: true,
	});

	useEffect(() => {
		let cancelled = false;
		const bootstrap = async () => {
			if (!id) {
				setSchema(null);
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
		bootstrap();
		return () => {
			cancelled = true;
		};
	}, [id, refreshFlag, setSchema]);

	useEffect(() => {
		if (!schema) {
			setViewport(null);
			return;
		}
		const width = toNumber(schema.settings?.width, 1920);
		const height = toNumber(schema.settings?.height, 1080);
		setViewport((prev) => {
			if (prev && prev.width === width && prev.height === height) return prev;
			return { width, height };
		});
	}, [schema]);

	const isCanvasEmpty = !schema?.children || schema.children.length === 0;
	const handleScroll = () => {
		const node = containerRef.current;
		if (!node) return;
		setScroll({ left: node.scrollLeft, top: node.scrollTop });
	};
	const rulerViewport = useMemo(() => {
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
			<div className="grid grid-cols-custom grid-rows-header h-[100vh] bg-slate-100/60">
				{/* 工具栏 */}
				<div className="row-start-1 row-end-2 col-start-1 col-end-4">
					<Toolbar pageId={pageId} onPageIdChange={setPageId} />
				</div>

				<DndWrapper scale={scale}>
					<SidebarMenu className="border-r border-slate-200 bg-white" />

					<div className="flex min-h-0 min-w-0 flex-col">
						{/* 缩放栏 */}
						<div className="flex items-center justify-between border-b border-slate-200 bg-white px-3 py-1.5 text-xs">
							<div className="flex items-center gap-3 text-slate-500">
								<span>
									画布 {viewport?.width ?? "--"} × {viewport?.height ?? "--"}
								</span>
								<span className="text-slate-400">{Math.round(scale * 100)}%</span>
							</div>
							<div className="flex items-center gap-1.5">
								<button
									className={`rounded-md border p-1 transition-all ${autoFit ? "border-brand-200 text-brand-500 bg-brand-50" : "border-slate-200 text-slate-400 hover:border-brand-200 hover:text-brand-500"}`}
									onClick={() => setAutoFit((v) => !v)}
								>
									<Maximize className="h-3.5 w-3.5" />
								</button>
								<div className="flex items-center gap-0.5 ml-1">
									<button
										className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all"
										onClick={() => handleZoomChange(manualZoom - 0.1)}
									>
										<Minus className="h-3.5 w-3.5" />
									</button>
									<span className="w-12 text-center text-xs text-slate-500">
										{Math.round(scale * 100)}%
									</span>
									<button
										className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all"
										onClick={() => handleZoomChange(manualZoom + 0.1)}
									>
										<Plus className="h-3.5 w-3.5" />
									</button>
									<button
										className="rounded-md border border-slate-200 p-1 text-slate-400 hover:border-brand-200 hover:text-brand-500 transition-all ml-0.5"
										onClick={handleResetZoom}
									>
										<RotateCcw className="h-3.5 w-3.5" />
									</button>
								</div>
							</div>
						</div>

						<div className="relative flex min-h-0 flex-1 overflow-hidden">
							<div
								className="absolute left-0 top-0 z-20 bg-white"
								style={{
									width: RULER_THICKNESS,
									height: RULER_THICKNESS,
									borderBottom: "1px solid #e2e8f0",
									borderRight: "1px solid #e2e8f0",
								}}
							/>
							<div className="absolute left-[28px] right-0 top-0 z-20">
								<Ruler
									orientation="x"
									viewport={rulerViewport}
									scale={scale}
									scroll={scroll.left}
									containerSize={containerRef.current?.clientWidth ?? 0}
								/>
							</div>
							<div className="absolute bottom-0 left-0 top-[28px] z-20">
								<Ruler
									orientation="y"
									viewport={rulerViewport}
									scale={scale}
									scroll={scroll.top}
									containerSize={containerRef.current?.clientHeight ?? 0}
								/>
							</div>
							<div
								className="ml-[28px] mt-[28px] flex-1 overflow-hidden"
								style={{ minWidth: 0, minHeight: 0 }}
							>
								<DroppableItem
									id={schema!.id}
									style={{ minHeight: "0", minWidth: "0" }}
								>
									<div
										ref={containerRef}
										id="canvas"
										className="relative h-full w-full min-w-0 overflow-auto bg-slate-100/80"
										style={{
											backgroundImage:
												"radial-gradient(circle, #e2e8f0 0.5px, transparent 0.5px)",
											backgroundSize: "16px 16px",
										}}
										onScroll={handleScroll}
									>
										<div
											className="relative"
											style={{
												width: scaledWidth,
												height: scaledHeight,
												minWidth: 320,
												minHeight: 180,
											}}
										>
											<div
												data-canvas-content="true"
												style={{
													width: viewport?.width ?? 0,
													height: viewport?.height ?? 0,
													transform: `scale(${scale})`,
													transformOrigin: "top left",
													position: "absolute",
													inset: 0,
												}}
											>
												{isCanvasEmpty && <CanvasEmpty />}
												<Renderer schema={schema!} scale={scale} />
											</div>
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

				<div className="h-full overflow-hidden border-l border-slate-200 bg-white">
					<PropertyPanel />
				</div>
			</div>
		</>
	);
}
