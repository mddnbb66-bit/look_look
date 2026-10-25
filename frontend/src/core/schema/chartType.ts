/**
 * @file 图表组件 Schema 定义
 *
 * 重构说明：
 * - dataSource 已从 props 提升到组件顶层（BaseChartComponent.dataSource）
 * - 字段映射（xAxisField/yAxisField 等）已统一收入 dataSource.fieldMapping
 * - props 中只保留纯视觉/交互配置
 */
import type { BaseChartComponentType, ChartBaseProps } from "./commonType";

/**
 * 单系列柱状图
 */
export interface BarChartProps extends ChartBaseProps {
	barColor?: string;
}

export interface BarChartComponentType extends BaseChartComponentType<BarChartProps> {
	type: "BarChart";
}

/**
 * 多系列柱状图（可用于分组 / 堆叠）
 */
export interface MultiBarChartProps extends ChartBaseProps {
	colorPalette?: string[];
	isStack?: boolean;
}

export interface MultiBarChartComponentType extends BaseChartComponentType<MultiBarChartProps> {
	type: "MultiBarChart";
}

/**
 * 折线图
 */
export interface LineChartProps extends ChartBaseProps {
	lineColor?: string;
	smooth?: boolean;
	areaStyle?: boolean;
}

export interface LineChartComponentType extends BaseChartComponentType<LineChartProps> {
	type: "LineChart";
}

/**
 * 单系列面积图（折线填充变体）
 */
export interface AreaChartComponentType extends BaseChartComponentType<LineChartProps> {
	type: "AreaChart";
}

/**
 * 多系列折线/面积图
 * - 支持多系列与平滑/面积
 */
export interface MultiLineChartProps extends ChartBaseProps {
	colorPalette?: string[];
	smooth?: boolean;
	areaStyle?: boolean;
}

export interface MultiLineChartComponentType extends BaseChartComponentType<MultiLineChartProps> {
	type: "MultiLineChart";
}

/**
 * 散点图
 */
export interface ScatterChartProps extends ChartBaseProps {
	pointSize?: number;
	pointColor?: string;
}

export interface ScatterChartComponentType extends BaseChartComponentType<ScatterChartProps> {
	type: "ScatterChart";
}

/**
 * 气泡图（散点变体）
 */
export interface BubbleChartProps extends ScatterChartProps {
	sizeRange?: [number, number];
	colorPalette?: string[];
}

export interface BubbleChartComponentType extends BaseChartComponentType<BubbleChartProps> {
	type: "BubbleChart";
}

/**
 * 横向柱状图
 * - 类目在 Y 轴，数值在 X 轴
 */
export interface HorizontalBarChartProps extends ChartBaseProps {
	barColor?: string;
}

export interface HorizontalBarChartComponentType extends BaseChartComponentType<HorizontalBarChartProps> {
	type: "HorizontalBarChart";
}

/**
 * 饼图 / 环形图
 */
export interface PieChartProps extends ChartBaseProps {
	innerRadius?: number;
}

export interface PieChartComponentType extends BaseChartComponentType<PieChartProps> {
	type: "PieChart";
}

/**
 * 南丁格尔玫瑰图（饼图变体）
 * - 支持面积/半径两种玫瑰模式
 */
export interface RosePieChartProps extends PieChartProps {
	roseType?: "area" | "radius";
}

export interface RosePieChartComponentType extends BaseChartComponentType<RosePieChartProps> {
	type: "RosePieChart";
}

/**
 * 雷达图
 */
export interface RadarChartProps extends ChartBaseProps {
	indicators: { name: string; max: number }[]; // 雷达指标
	colorPalette?: string[];
}

export interface RadarChartComponentType extends BaseChartComponentType<RadarChartProps> {
	type: "RadarChart";
}

/**
 * 漏斗图
 */
export interface FunnelChartProps extends ChartBaseProps {
	sort?: "ascending" | "descending" | "none";
	colorPalette?: string[];
}

export interface FunnelChartComponentType extends BaseChartComponentType<FunnelChartProps> {
	type: "FunnelChart";
}

/**
 * 仪表盘
 */
export interface GaugeChartProps extends ChartBaseProps {
	value: number;
	min: number;
	max: number;
	gaugeColor?: string;
	unit?: string;
}

export interface GaugeChartComponentType extends BaseChartComponentType<GaugeChartProps> {
	type: "GaugeChart";
}

/**
 * 矩形树图
 */
export interface TreemapChartProps extends ChartBaseProps {
	colorPalette?: string[];
}

export interface TreemapChartComponentType extends BaseChartComponentType<TreemapChartProps> {
	type: "TreemapChart";
}
