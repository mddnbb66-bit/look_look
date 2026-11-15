//登录之后的页，也就是项目页
import { useCallback, useEffect, useMemo, useState } from "react";
import { Modal } from "antd";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { deletePage, listPages, type PageSummary } from "@/api/page";
import { useSchemaStore } from "@/store/schema-store";
import { useShallow } from "zustand/shallow";
import { savePage, type SavePageResponse } from "@/api/page";
import { getCurrentUserId } from "@/utils/auth";
import { Plus, Settings, ArrowLeft, Trash2, LayoutDashboard } from "lucide-react";
//项目页的crud
export default function ProjectList() {
	const navigate = useNavigate();
	const [projects, setProjects] = useState<PageSummary[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [manageMode, setManageMode] = useState(false);
	const [deletingId, setDeletingId] = useState("");
	const [thumbErrorMap, setThumbErrorMap] = useState<Record<string, boolean>>({});
	const { setSchema } = useSchemaStore(useShallow((state) => ({ setSchema: state.setSchema })));

	const formatTime = (value?: string) => (value ? dayjs(value).format("YYYY-MM-DD HH:mm") : "--");
	useEffect(() => {
		let cancelled = false;
		//cancelled === false // 本轮 Effect 尚未被清理，可以使用结果
		//cancelled === true  // 本轮 Effect 已被清理，不再使用结果
		//查询项目列表
		const fetchProjects = async () => {
			setLoading(true);
			setError("");
			try {
				const userId = getCurrentUserId();
				const resp = await listPages(userId);
				const { code, data, message } = (resp as any) || {}; //原项目懒狗之处
				if (code !== undefined && code !== 0) throw new Error(message || "获取项目失败"); //
				if (cancelled) return;
				setProjects(Array.isArray(data) ? data : []);
			} catch (err: any) {
				if (cancelled) return;
				setError(err?.message || "获取项目失败");
			} finally {
				if (!cancelled) setLoading(false); //如果组件没有卸载，那么就不加载
			}
		};
		fetchProjects();
		return () => {
			cancelled = true;
		};
	}, []);
	//创建项目的函数，
	const handleCreateProject = useCallback(async () => {
		setSchema();
		const latestSchema = useSchemaStore.getState().schema;
		if (!latestSchema) return;

		const resp: SavePageResponse = await savePage({
			//传给后端的东西
			schema: latestSchema,
			meta: {
				title: latestSchema.props?.title,
				description: latestSchema.props?.description,
			},
			userId: getCurrentUserId(),
		});
		if (resp.code === 0) navigate(`/editor/${resp.data.pageId}`);
	}, [navigate, setSchema]);

	const toggleManageMode = () => setManageMode((prev) => !prev);
	//点击对应项目直接跳转
	const lookProjectDetail = (pageId: string) => {
		if (manageMode) return;
		navigate(`/editor/${pageId}`);
	};
	const handleThumbError = (pageId: string) => {
		setThumbErrorMap((prev) => ({ ...prev, [pageId]: true }));
	};
	//删除项目
	const handleDeleteProject = (pageId: string, name: string) => {
		//弹窗用
		Modal.confirm({
			title: "确认删除项目",
			content: `确定删除项目「${name}」吗？删除后不可恢复。`,
			okText: "确定",
			cancelText: "取消",
			okButtonProps: { danger: true },
			centered: true,
			async onOk() {
				setDeletingId(pageId);
				setError("");
				try {
					const resp = ((await deletePage(pageId)) as any) || {};
					const { code, message } = resp;
					if (code !== undefined && code !== 0) throw new Error(message || "删除失败");
					setProjects((prev) => prev.filter((item) => item.pageId !== pageId));
				} catch (err: any) {
					setError(err?.message || "删除失败");
					throw err;
				} finally {
					setDeletingId("");
				}
			},
		});
	};

	const emptyState = useMemo(
		() =>
			!loading &&
			!projects.length &&
			!error && (
				// 空状态：一个虚线框（表示「这里可以放东西」），里面是图标、两行字和新建按钮
				<div className="animate-fade-in rounded-lg border border-dashed border-slate-300 px-6 py-16 text-center">
					<LayoutDashboard className="mx-auto h-6 w-6 text-slate-400" />
					<div className="mt-3 text-sm font-semibold text-slate-900">还没有项目</div>
					<div className="mt-1 text-sm text-slate-500">
						点击新建项目，开始你的第一块大屏
					</div>
					<button className="vc-btn mt-6" onClick={handleCreateProject}>
						<Plus className="h-4 w-4" /> 新建项目
					</button>
				</div>
			),
		[error, handleCreateProject, loading, projects.length]
	);

	return (
		// 整页一屏高，分上下两块：标题栏固定（flex-shrink-0），项目网格占满剩余并在内部滚动
		<div className="flex h-screen flex-col bg-slate-50 text-slate-900">
			<header className="mx-auto w-full max-w-6xl flex-shrink-0 px-6 pb-6 pt-10">
				<div className="flex items-end justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">我的项目</h1>
						<p className="mt-1 text-sm text-slate-500">管理你的可视化大屏项目</p>
					</div>
					{/* 三个按钮从左到右由轻到重：返回、管理是次按钮，唯一的主按钮「新建」放最右 */}
					<div className="flex gap-2">
						<button
							className="vc-btn-ghost"
							onClick={() => navigate("/")}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" /> 返回首页
						</button>
						<button className="vc-btn-ghost" onClick={toggleManageMode} type="button">
							<Settings className="h-4 w-4" />
							{manageMode ? "退出管理" : "管理项目"}
						</button>
						<button className="vc-btn" onClick={handleCreateProject} type="button">
							<Plus className="h-4 w-4" /> 新建项目
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-6 pb-12">
				{error && (
					<div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
						{error}
					</div>
				)}
				{loading && (
					<div className="mb-4 flex items-center gap-2 text-sm text-slate-500">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-slate-900" />
						正在加载项目...
					</div>
				)}

				{/* 响应式列数：手机 1 列，平板 2 列，桌面 3 列 */}
				<div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
					{projects.map((item, index) => {
						const title = item.title || item.name || "未命名项目";
						const desc = item.description || "暂无描述";
						const showImage = item.thumbnailUrl && !thumbErrorMap[item.pageId];
						return (
							<div
								key={item.pageId}
								role="button"
								tabIndex={0}
								className="group vc-card p-0 overflow-hidden text-left cursor-pointer animate-slide-up relative"
								style={{ animationDelay: `${index * 50}ms` }}
								onClick={() => lookProjectDetail(item.pageId)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										lookProjectDetail(item.pageId);
									}
								}}
							>
								{manageMode && (
									<button
										type="button"
										className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-md border border-slate-200 bg-white text-red-600 transition-colors hover:border-red-200 hover:bg-red-50 disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteProject(item.pageId, item.name);
										}}
										disabled={deletingId === item.pageId} //按钮判断正在删除的是自己？
										aria-label={`删除项目 ${item.name}`}
									>
										{deletingId === item.pageId ? (
											<div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-red-200 border-t-red-600" />
										) : (
											<Trash2 className="h-3.5 w-3.5" />
										)}
									</button>
								)}
								{/* 缩略图区：aspect-video 固定为 16:9，和大屏的常见比例一致，高度跟着卡片宽度变 */}
								<div className="relative flex aspect-video items-center justify-center overflow-hidden border-b border-slate-200 bg-slate-100">
									{showImage ? (
										<img
											src={item.thumbnailUrl}
											alt={`${title} 缩略图`}
											className="h-full w-full object-cover"
											loading="lazy"
											onError={() => handleThumbError(item.pageId)}
										/>
									) : (
										<div className="flex flex-col items-center gap-2 text-slate-400">
											<LayoutDashboard className="h-6 w-6" />
											<span className="text-xs">暂无缩略图</span>
										</div>
									)}
								</div>
								{/* 文字区：标题一行（超长截断）→ 描述一行 → 时间 */}
								<div className="p-4">
									<div className="truncate text-sm font-semibold text-slate-900">
										{title}
									</div>
									<div className="mt-1 truncate text-sm text-slate-500">{desc}</div>
									<div className="mt-3 flex justify-between text-xs tabular-nums text-slate-500">
										<span>创建：{formatTime(item.createdAt)}</span>
										<span>更新：{formatTime(item.updatedAt)}</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>
				{emptyState}
			</main>
		</div>
	);
}
