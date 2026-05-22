import { useState } from "react";
import type { MenuProps } from "antd";
import { Menu } from "antd";
import { Puzzle, ChartArea } from "lucide-react";
import BasicPanel from "./BasicPanel";
import ChartPanel from "./ChartPanel";

type MenuItem = Required<MenuProps>["items"][number];
type ItemType =
	| "basic"
	| "charts-bar"
	| "charts-line"
	| "charts-pie"
	| "charts-scatter"
	| "charts-other";

const items: MenuItem[] = [
	{ key: "basic", icon: <Puzzle className="h-4 w-4" />, label: "基础组件" },
	{
		key: "charts",
		icon: <ChartArea className="h-4 w-4" />,
		label: "图表组件",
		children: [
			{ key: "charts-bar", label: "柱状图" },
			{ key: "charts-line", label: "折线图" },
			{ key: "charts-pie", label: "饼图" },
			{ key: "charts-scatter", label: "散点/气泡图" },
			{ key: "charts-other", label: "其他图表" },
		],
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
	const handleItemSelected: MenuProps["onSelect"] = ({ key }) => {
		setSelectedKey(key as ItemType);
	};
	const chartCategory = chartMenuKeyMap[selectedKey];

	return (
		<div className={`flex ${className}`}>
			<Menu
				className="w-[155px]"
				mode="inline"
				inlineIndent={16}
				items={items}
				selectedKeys={[selectedKey]}
				defaultOpenKeys={["charts"]}
				onSelect={handleItemSelected}
			/>
			{selectedKey === "basic" && <BasicPanel />}
			{chartCategory && <ChartPanel category={chartCategory} />}
		</div>
	);
}
