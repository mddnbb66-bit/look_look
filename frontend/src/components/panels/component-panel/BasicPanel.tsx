import type React from "react";
import {
	AlignJustify,
	Box,
	Clock3,
	Image,
	MousePointerClick,
	TrendingUp,
	Activity,
	Timer,
	Minus,
	Bell,
	TagIcon,
	UserCircle,
	Star,
	ToggleLeft,
} from "lucide-react";
import DraggableItem from "@/core/dnd-kit/DraggableItem";

interface ComponentItem {
	type: string;
	name: string;
	icon: React.ReactNode;
}

/**
 * 一个可拖拽的物料格子：上面图标，下面名称
 * - 没有边框和阴影，只用一块很浅的灰底；悬停时底色加深一档
 * - cursor-grab / active:cursor-grabbing：鼠标样式提示「这个可以拖」
 * - ChartPanel 里的格子用的是同一套类名，改这里时两边一起改
 */
function PanelItem({ type, name, icon }: ComponentItem) {
	return (
		<DraggableItem id={type}>
			<div className="flex h-16 cursor-grab flex-col items-center justify-center gap-1.5 rounded-md bg-slate-50 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:cursor-grabbing">
				{icon}
				<span className="leading-none">{name}</span>
			</div>
		</DraggableItem>
	);
}

export default function BasicPanel() {
	const component: ComponentItem[] = [
		{ type: "Text", name: "文字组件", icon: <AlignJustify className="h-5 w-5" /> },
		{ type: "Image", name: "图片组件", icon: <Image className="h-5 w-5" /> },
		{ type: "Button", name: "按钮组件", icon: <MousePointerClick className="h-5 w-5" /> },
		{ type: "Clock", name: "时钟组件", icon: <Clock3 className="h-5 w-5" /> },
		{ type: "StatisticCard", name: "指标卡", icon: <TrendingUp className="h-5 w-5" /> },
		{ type: "ProgressBar", name: "进度条", icon: <Activity className="h-5 w-5" /> },
		{ type: "Countdown", name: "倒计时", icon: <Timer className="h-5 w-5" /> },
		{ type: "Divider", name: "分割线", icon: <Minus className="h-5 w-5" /> },
		{ type: "Badge", name: "徽标数", icon: <Bell className="h-5 w-5" /> },
		{ type: "Tag", name: "标签", icon: <TagIcon className="h-5 w-5" /> },
		{ type: "Avatar", name: "头像", icon: <UserCircle className="h-5 w-5" /> },
		{ type: "Rate", name: "评分", icon: <Star className="h-5 w-5" /> },
		{ type: "Switch", name: "开关", icon: <ToggleLeft className="h-5 w-5" /> },
		{ type: "Container", name: "容器组件", icon: <Box className="h-5 w-5" /> },
	];

	return (
		// 两列网格，宽度跟随父容器（SidebarMenu 的右半边），不再写死 265px
		<div className="grid grid-cols-2 gap-2 px-3 pb-3">
			{component.map((item) => (
				<PanelItem key={item.type} {...item} />
			))}
		</div>
	);
}
