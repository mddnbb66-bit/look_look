import { useCallback } from "react";
import { Input, InputNumber, Collapse, ColorPicker } from "antd";
import type { FormHints, FormHint } from "@/config/hints";

/**
 * 页面配置表单字段分组
 */
interface PageFieldGroup {
	key: string;
	title: string;
	fields: string[];
}

interface PageFormRendererProps {
	values: Record<string, any>;
	hints: FormHints;
	groups: PageFieldGroup[];
	onChange: (key: string, value: any) => void;
}

/**
 * 页面配置自建表单渲染器
 * - 支持 Collapse 分组布局
 * - 与 PropsFormRenderer 共享 FieldRow 渲染逻辑但更简单（页面字段类型有限）
 */
export default function PageFormRenderer({
	values,
	hints,
	groups,
	onChange,
}: PageFormRendererProps) {
	const collapseItems = groups.map((group) => ({
		key: group.key,
		label: group.title,
		children: (
			<div className="flex flex-col gap-3">
				{group.fields.map((fieldKey) => (
					<PageFieldRow
						key={fieldKey}
						fieldKey={fieldKey}
						value={values[fieldKey]}
						hint={hints[fieldKey]}
						onChange={onChange}
					/>
				))}
			</div>
		),
	}));

	// bordered={false}：去掉 Collapse 的外框和灰色标题底，只保留分组之间的一条细线。
	// classNames.title：AntD 6 提供的「语义化类名」入口，可以直接给标题文字加 Tailwind 类。
	return (
		<Collapse
			size="small"
			bordered={false}
			defaultActiveKey={groups.map((g) => g.key)}
			items={collapseItems}
			classNames={{ title: "text-xs font-semibold text-slate-700" }}
		/>
	);
}

interface PageFieldRowProps {
	fieldKey: string;
	value: any;
	hint?: FormHint;
	onChange: (key: string, val: any) => void;
}

function PageFieldRow({ fieldKey, value, hint, onChange }: PageFieldRowProps) {
	const label = hint?.title ?? fieldKey;
	const description = hint?.description;

	const handleChange = useCallback((val: any) => onChange(fieldKey, val), [fieldKey, onChange]);

	const type = typeof value;

	// 行布局和 PropsFormRenderer 的 FieldRow 相同：左 76px 标题，右边控件，说明文字跟在控件下面
	// color → ColorPicker（同时保留文字输入）
	if (hint?.widget === "color") {
		return (
			<div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-x-2">
				<label className="pt-1 text-xs leading-4 text-slate-500">{label}</label>
				<div className="min-w-0">
					<ColorPicker
						size="small"
						value={value || "#ffffff"}
						showText
						format="hex"
						onChange={(_, hex) => handleChange(hex)}
					/>
					{description && (
						<p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
					)}
				</div>
			</div>
		);
	}

	let control: React.ReactNode;
	if (type === "number") {
		control = (
			<InputNumber
				size="small"
				className="w-full"
				value={value}
				min={hint?.min}
				max={hint?.max}
				onChange={(v) => handleChange(v ?? 0)}
			/>
		);
	} else if (hint?.widget === "textarea") {
		control = (
			<Input.TextArea
				size="small"
				rows={2}
				value={value ?? ""}
				placeholder={hint?.placeholder}
				onChange={(e) => handleChange(e.target.value)}
			/>
		);
	} else {
		control = (
			<Input
				size="small"
				value={value ?? ""}
				placeholder={hint?.placeholder}
				onChange={(e) => handleChange(e.target.value)}
			/>
		);
	}

	return (
		<div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-x-2">
			<label className="pt-1 text-xs leading-4 text-slate-500">{label}</label>
			<div className="min-w-0">
				{control}
				{description && (
					<p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
				)}
			</div>
		</div>
	);
}

/** 页面配置 hints */
export const pageHints: FormHints = {
	name: { title: "页面名称", placeholder: "如：销售大屏" },
	title: { title: "展示标题", placeholder: "用于对外展示的标题" },
	description: { title: "页面描述", widget: "textarea", placeholder: "简要描述页面用途" },
	width: { title: "宽度", min: 320 },
	height: { title: "高度", min: 180 },
	gridSize: { title: "吸附网格", min: 1, description: "可选，编辑态的吸附步进" },
	backgroundColor: { title: "背景色", widget: "color", placeholder: "例如：#ffffff" },
	backgroundImage: { title: "背景图 URL", placeholder: "https://example.com/bg.png" },
};

/** 页面配置分组 */
export const pageFieldGroups = [
	{ key: "basic", title: "基础信息", fields: ["name", "title", "description"] },
	{ key: "size", title: "画布尺寸 (px)", fields: ["width", "height", "gridSize"] },
	{ key: "style", title: "背景样式", fields: ["backgroundColor", "backgroundImage"] },
];
