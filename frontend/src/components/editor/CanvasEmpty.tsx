import { MousePointerClick } from "lucide-react";

export default function CanvasEmpty() {
	return (
		<div className="absolute inset-0 flex items-center justify-center pointer-events-none">
			<div className="w-full max-w-xs rounded-xl border border-dashed border-slate-200 bg-white/90 backdrop-blur-sm p-6 text-center space-y-3 shadow-soft">
				<div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-brand-50 text-brand-500">
					<MousePointerClick className="h-6 w-6" />
				</div>
				<div className="text-sm font-medium text-slate-700">画布为空</div>
				<p className="text-xs text-slate-400">
					从左侧拖拽组件到画布，或点击组件后再拖动进行布局。
				</p>
				<div className="flex items-center justify-center gap-2 text-xs text-slate-400">
					<span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5">
						拖拽放置
					</span>
					<span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5">
						选中调整
					</span>
				</div>
			</div>
		</div>
	);
}
