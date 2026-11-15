import { MousePointerClick } from "lucide-react";

/**
 * 画布为空时的提示
 * 这段内容在 #canvas 里面，会跟着画布一起被缩放（比如缩到 48%）。
 * 所以字号故意写大一些（text-2xl / text-lg），缩小之后在屏幕上才是正常可读的大小。
 *
 * z-10：这个提示在 DOM 里排在画布内容（Renderer）前面，而画布根节点自带白色背景，
 * 不抬高层级的话会被白底完全盖住、根本看不见。
 * pointer-events-none：提示不接收鼠标事件，不会挡住往画布上拖放组件。
 */
export default function CanvasEmpty() {
	return (
		<div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 text-center">
			<MousePointerClick className="h-10 w-10 text-slate-300" />
			<div className="text-2xl font-medium text-slate-500">画布为空</div>
			<p className="text-lg text-slate-400">
				从左侧拖拽组件到画布，或点击组件后再拖动进行布局。
			</p>
		</div>
	);
}
