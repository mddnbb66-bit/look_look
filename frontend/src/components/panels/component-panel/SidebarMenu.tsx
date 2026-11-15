import type React from "react";
import { useState } from "react";
import { Puzzle, BarChart3, LineChart, PieChart, ScatterChart, Shapes } from "lucide-react";
import BasicPanel from "./BasicPanel";
import ChartPanel from "./ChartPanel";

type ItemType =
	| "basic"
	| "charts-bar"
	| "charts-line"
	| "charts-pie"
	| "charts-scatter"
	| "charts-other";

/**
 * 左侧的分类列表
 * - short：窄栏里显示的两个字
 * - label：完整名称，显示在右边面板的标题，也作为鼠标悬停提示
 *
 * 原来这里用的是 AntD 的 Menu（155px 宽、带展开收起）。
 * 现在换成一条 56px 的图标窄栏：分类只有 6 个，不需要两级菜单，省下的宽度都让给画布。
 */
interface Category {
	key: ItemType;
	short: string;
	label: string;
	icon: React.ReactNode;
}

const categories: Category[] = [
	{ key: "basic", short: "基础", label: "基础组件", icon: <Puzzle className="h-[18px] w-[18px]" /> },
	{
		key: "charts-bar",
		short: "柱状",
		label: "柱状图",
		icon: <BarChart3 className="h-[18px] w-[18px]" />,
	},
	{
		key: "charts-line",
		short: "折线",
		label: "折线图",
		icon: <LineChart className="h-[18px] w-[18px]" />,
	},
	{
		key: "charts-pie",
		short: "饼图",
		label: "饼图",
		icon: <PieChart className="h-[18px] w-[18px]" />,
	},
	{
		key: "charts-scatter",
		short: "散点",
		label: "散点/气泡图",
		icon: <ScatterChart className="h-[18px] w-[18px]" />,
	},
	{
		key: "charts-other",
		short: "其他",
		label: "其他图表",
		icon: <Shapes className="h-[18px] w-[18px]" />,
	},
];

const chartMenuKeyMap: Partial<Record<ItemType, "bar" | "line" | "pie" | "scatter" | "other">> = {
	"charts-bar": "bar",
	"charts-line": "line",
	"charts-pie": "pie",
	"charts-scatter": "scatter",
	"charts-other": "other",
};

export default function SidebarMenu({ className }: { className?: string }) {
	const [selectedKey, setSelectedKey] = useState<ItemType>("basic");
	const chartCategory = chartMenuKeyMap[selectedKey];
	// 当前分类的完整名称，用作右边面板的标题
	const selectedLabel = categories.find((item) => item.key === selectedKey)?.label;

	return (
		<div className={`flex ${className}`}>
			{/* 左：分类窄栏。shrink-0 保证它始终是 56px，不被右边挤窄 */}
			<nav className="flex w-14 shrink-0 flex-col items-center gap-1 border-r border-slate-200 py-2">
				{categories.map((item) => {
					const isSelected = item.key === selectedKey;
					return (
						<button
							key={item.key}
							type="button"
							title={item.label}
							onClick={() => setSelectedKey(item.key)}
							className={`flex h-12 w-12 flex-col items-center justify-center gap-1 rounded-md text-[11px] leading-none transition-colors ${
								isSelected
									? "bg-slate-100 font-medium text-slate-900"
									: "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
							}`}
						>
							{item.icon}
							{item.short}
						</button>
					);
				})}
			</nav>

			{/* 右：当前分类下的组件。min-w-0 + flex-1 占满剩余宽度；内容多了在这一栏内部滚动 */}
			<div className="flex min-w-0 flex-1 flex-col">
				<div className="flex h-10 shrink-0 items-center px-3 text-xs font-medium text-slate-500">
					{selectedLabel}
				</div>
				<div className="min-h-0 flex-1 overflow-y-auto">
					{selectedKey === "basic" && <BasicPanel />}
					{chartCategory && <ChartPanel category={chartCategory} />}
				</div>
			</div>
		</div>
	);
}
