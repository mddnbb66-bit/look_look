import { MousePointer2 } from "lucide-react";

/**
 * 属性面板的空状态
 * 只放一个小图标和两行字，不再套虚线卡片：空状态本身不是重点，越安静越好。
 */
export default function EmptyPanel() {
	return (
		<div className="flex h-full flex-col items-center justify-center gap-2 px-8 text-center">
			<MousePointer2 className="h-5 w-5 text-slate-300" />
			<div className="text-[13px] font-medium text-slate-700">尚未选择组件</div>
			<p className="text-xs leading-relaxed text-slate-500">
				点击左侧组件或画布节点后，这里会展示可配置的属性。
			</p>
		</div>
	);
}
