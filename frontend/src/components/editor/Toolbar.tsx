import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { savePage, type SavePageResponse } from "@/api/page";
import { useSchemaStore } from "@/store/schema-store";
import { useShallow } from "zustand/shallow";
import { captureNodeThumbnail } from "@/utils/thumbnail";
import { getCurrentUserId } from "@/utils/auth";
import { Save, Eye, CheckCircle, AlertCircle } from "lucide-react";

type StatusType = "idle" | "success" | "error";

interface ToolbarProps {
	pageId?: string | null;
	onPageIdChange?: (pageId: string) => void;
}

export default function Toolbar({ pageId = null, onPageIdChange }: ToolbarProps) {
	const { schema } = useSchemaStore(useShallow((state) => ({ schema: state.schema })));
	const navigate = useNavigate();
	const [saving, setSaving] = useState(false);
	const [status, setStatus] = useState<{ type: StatusType; message: string }>({
		type: "idle",
		message: "",
	});
	const disabled = useMemo(() => !schema || saving, [schema, saving]);

	const handleSave = async () => {
		if (!schema || saving) return;
		setSaving(true);
		setStatus({ type: "idle", message: "" });

		const canvasNode = document.querySelector<HTMLElement>("[data-canvas-content='true']");
		const thumbnailPromise = (async () => {
			const captured = await captureNodeThumbnail(canvasNode, {
				pixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
				timeoutMs: 800,
				targetWidth: 720,
			});
			return captured ?? null;
		})();

		const payload = {
			pageId: pageId || "",
			schema,
			meta: { title: schema.props?.title, description: schema.props?.description },
			thumbnail: (await thumbnailPromise) ?? undefined,
			userId: getCurrentUserId(),
		};

		try {
			const resp = await savePage(payload);
			const resBody = (resp as any)?.data ?? resp;
			const { code, message, data } = resBody || {};
			if (code !== undefined && code !== 0) throw new Error(message || "保存失败");
			const result = data as SavePageResponse["data"] | undefined;
			const newPageId = result?.pageId || (result as any)?._id;
			if (newPageId && onPageIdChange) onPageIdChange(newPageId);
			setStatus({ type: "success", message: message || "保存成功" });
		} catch (err: any) {
			setStatus({ type: "error", message: err?.message || "保存失败" });
		} finally {
			setSaving(false);
		}
	};

	const handlePreview = () => {
		if (!pageId) return;
		navigate(`/preview/${pageId}`);
	};

	return (
		<div className="flex h-full items-center justify-between px-4 bg-white border-b border-slate-200">
			<div className="flex items-center gap-3">
				<div className="flex items-center gap-2">
					<div className="h-7 w-7 rounded-md bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-[10px] font-bold text-white shadow-brand-soft">
						VC
					</div>
					<span className="text-sm font-medium text-slate-700">编辑器</span>
				</div>
				{pageId && (
					<span className="text-xs text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
						ID: {pageId}
					</span>
				)}
			</div>

			<div className="flex items-center gap-3">
				{status.message && (
					<span
						className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-md ${
							status.type === "error"
								? "text-red-600 bg-red-50"
								: "text-emerald-600 bg-emerald-50"
						}`}
					>
						{status.type === "error" ? (
							<AlertCircle className="h-3 w-3" />
						) : (
							<CheckCircle className="h-3 w-3" />
						)}
						{status.message}
					</span>
				)}
				<button
					className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
						disabled
							? "bg-slate-100 text-slate-400 cursor-not-allowed"
							: "bg-brand-500 text-white hover:bg-brand-600 shadow-brand-soft"
					}`}
					disabled={disabled}
					onClick={handleSave}
				>
					<Save className="h-3.5 w-3.5" />
					{saving ? "保存中..." : "保存"}
				</button>
				<button
					className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
						!pageId
							? "bg-slate-100 text-slate-400 cursor-not-allowed"
							: "border border-slate-200 text-slate-600 hover:border-brand-300 hover:text-brand-600"
					}`}
					disabled={!pageId}
					onClick={handlePreview}
				>
					<Eye className="h-3.5 w-3.5" />
					预览
				</button>
			</div>
		</div>
	);
}
