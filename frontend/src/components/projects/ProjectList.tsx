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
		const fetchProjects = async () => {
			setLoading(true);
			setError("");
			try {
				const userId = getCurrentUserId();
				const resp = await listPages(userId);
				const { code, data, message } = (resp as any) || {};
				if (code !== undefined && code !== 0) throw new Error(message || "获取项目失败");
				if (cancelled) return;
				setProjects(Array.isArray(data) ? data : []);
			} catch (err: any) {
				if (cancelled) return;
				setError(err?.message || "获取项目失败");
			} finally {
				if (!cancelled) setLoading(false);
			}
		};
		fetchProjects();
		return () => {
			cancelled = true;
		};
	}, []);

	const handleCreateProject = useCallback(async () => {
		setSchema();
		const latestSchema = useSchemaStore.getState().schema;
		if (!latestSchema) return;
		const resp: SavePageResponse = await savePage({
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
	const handleEnterProject = (pageId: string) => {
		if (manageMode) return;
		navigate(`/editor/${pageId}`);
	};
	const handleThumbError = (pageId: string) => {
		setThumbErrorMap((prev) => ({ ...prev, [pageId]: true }));
	};

	const handleDeleteProject = (pageId: string) => {
		const target = projects.find((item) => item.pageId === pageId);
		const title = target?.title || target?.name || "该项目";
		Modal.confirm({
			title: "确认删除项目",
			content: `确定删除项目「${title}」吗？删除后不可恢复。`,
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
				<div className="vc-card p-12 text-center animate-fade-in">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
						<LayoutDashboard className="h-7 w-7" />
					</div>
					<div className="text-lg font-semibold mb-2 text-slate-800">还没有项目</div>
					<div className="text-sm text-slate-400 mb-6">
						点击新建项目，开始你的第一块大屏
					</div>
					<button className="vc-btn" onClick={handleCreateProject}>
						<Plus className="h-4 w-4" /> 新建项目
					</button>
				</div>
			),
		[error, handleCreateProject, loading, projects.length]
	);

	return (
		<div className="h-screen bg-slate-50 text-slate-800 flex flex-col">
			<header className="mx-auto w-full max-w-6xl flex-shrink-0 px-6 py-8">
				<div className="flex items-center justify-between">
					<div>
						<p className="text-sm text-slate-400 mb-1">管理你的可视化大屏项目</p>
						<h1 className="text-3xl font-bold text-slate-900">我的项目</h1>
					</div>
					<div className="flex gap-3">
						<button className="vc-btn-ghost" onClick={toggleManageMode} type="button">
							<Settings className="h-4 w-4" />
							{manageMode ? "退出管理" : "管理项目"}
						</button>
						<button className="vc-btn" onClick={handleCreateProject} type="button">
							<Plus className="h-4 w-4" /> 新建项目
						</button>
						<button
							className="vc-btn-ghost"
							onClick={() => navigate("/")}
							type="button"
						>
							<ArrowLeft className="h-4 w-4" /> 返回首页
						</button>
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 overflow-y-auto px-6 pb-12">
				{error && (
					<div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
						{error}
					</div>
				)}
				{loading && (
					<div className="flex items-center gap-2 mb-4 text-sm text-slate-400">
						<div className="h-4 w-4 border-2 border-brand-200 border-t-brand-500 rounded-full animate-spin" />
						正在加载项目...
					</div>
				)}

				<div className="grid grid-cols-1 gap-6 md:grid-cols-3">
					{projects.map((item, index) => {
						const title = item.title || item.name || "未命名项目";
						const desc = item.description || "暂无描述";
						const showImage = item.thumbnailUrl && !thumbErrorMap[item.pageId];
						return (
							<div
								key={item.pageId}
								role="button"
								tabIndex={0}
								className="group vc-card p-0 overflow-hidden text-left cursor-pointer animate-slide-up"
								style={{ animationDelay: `${index * 50}ms` }}
								onClick={() => handleEnterProject(item.pageId)}
								onKeyDown={(e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleEnterProject(item.pageId);
									}
								}}
							>
								{manageMode && (
									<button
										type="button"
										className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-lg bg-red-500 text-white shadow-md transition hover:bg-red-600 hover:scale-110 disabled:opacity-50"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteProject(item.pageId);
										}}
										disabled={deletingId === item.pageId}
										aria-label={`删除项目 ${title}`}
									>
										{deletingId === item.pageId ? (
											<div className="h-3.5 w-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
										) : (
											<Trash2 className="h-3.5 w-3.5" />
										)}
									</button>
								)}
								<div className="relative flex h-[210px] items-center justify-center overflow-hidden bg-slate-50 border-b border-slate-100">
									{showImage ? (
										<img
											src={item.thumbnailUrl}
											alt={`${title} 缩略图`}
											className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
											loading="lazy"
											onError={() => handleThumbError(item.pageId)}
										/>
									) : (
										<div className="flex flex-col items-center gap-2 text-slate-300">
											<LayoutDashboard className="h-8 w-8" />
											<span className="text-xs">缩略图占位</span>
										</div>
									)}
								</div>
								<div className="p-5 space-y-2">
									<div className="text-base font-semibold text-slate-800 group-hover:text-brand-600 transition-colors">
										{title}
									</div>
									<div className="text-sm text-slate-400 line-clamp-2">
										{desc}
									</div>
									<div className="flex justify-between text-xs text-slate-400 pt-1">
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
