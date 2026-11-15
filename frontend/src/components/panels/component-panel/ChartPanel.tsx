import type React from "react";
import {
	BarChart2,
	BarChart3,
	BarChartHorizontal,
	AreaChart as AreaChartIcon,
	LineChart,
	PieChart,
	CircleDot,
	Circle,
	Radar,
	GitMerge,
	Gauge,
	LayoutGrid,
} from "lucide-react";
import DraggableItem from "@/core/dnd-kit/DraggableItem";

type ChartCategory = "bar" | "line" | "pie" | "scatter" | "other";
interface ChartItem {
	type: string;
	name: string;
	icon: React.ReactNode;
}

// 和 BasicPanel 的 PanelItem 是同一套外观，说明见那边的注释
function ChartPanelItem({ type, name, icon }: ChartItem) {
	return (
		<DraggableItem id={type}>
			<div className="flex h-16 cursor-grab flex-col items-center justify-center gap-1.5 rounded-md bg-slate-50 text-xs text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 active:cursor-grabbing">
				{icon}
				<span className="leading-none">{name}</span>
			</div>
		</DraggableItem>
	);
}

const chartItemsByCategory: Record<ChartCategory, ChartItem[]> = {
	bar: [
		{ type: "BarChart", name: "基础柱状图", icon: <BarChart2 className="h-5 w-5" /> },
		{
			type: "HorizontalBarChart",
			name: "横向柱状图",
			icon: <BarChartHorizontal className="h-5 w-5" />,
		},
		{ type: "MultiBarChart", name: "多系列柱状图", icon: <BarChart3 className="h-5 w-5" /> },
	],
	line: [
		{ type: "LineChart", name: "折线图", icon: <LineChart className="h-5 w-5" /> },
		{ type: "AreaChart", name: "面积图", icon: <AreaChartIcon className="h-5 w-5" /> },
		{ type: "MultiLineChart", name: "多系列折线图", icon: <LineChart className="h-5 w-5" /> },
	],
	pie: [
		{ type: "PieChart", name: "饼图/环形图", icon: <PieChart className="h-5 w-5" /> },
		{ type: "RosePieChart", name: "玫瑰图", icon: <PieChart className="h-5 w-5" /> },
	],
	scatter: [
		{ type: "ScatterChart", name: "散点图", icon: <CircleDot className="h-5 w-5" /> },
		{ type: "BubbleChart", name: "气泡图", icon: <Circle className="h-5 w-5" /> },
	],
	other: [
		{ type: "RadarChart", name: "雷达图", icon: <Radar className="h-5 w-5" /> },
		{ type: "FunnelChart", name: "漏斗图", icon: <GitMerge className="h-5 w-5" /> },
		{ type: "GaugeChart", name: "仪表盘", icon: <Gauge className="h-5 w-5" /> },
		{ type: "TreemapChart", name: "矩形树图", icon: <LayoutGrid className="h-5 w-5" /> },
	],
};

export default function ChartPanel({ category }: { category: ChartCategory }) {
	const chartItems = chartItemsByCategory[category] ?? chartItemsByCategory.bar;
	return (
		<div className="grid grid-cols-2 gap-2 px-3 pb-3">
			{chartItems.map((item) => (
				<ChartPanelItem key={item.type} {...item} />
			))}
		</div>
	);
}
