import { useCallback } from "react";
import { Input, InputNumber, Switch, Select, Radio, ColorPicker } from "antd";
import type { ComponentType } from "@/core/schema/commonType";
import type { FormHints, FormHint } from "@/config/hints";
import { componentHintsRegistry } from "@/config/hints";

interface PropsFormRendererProps {
	componentType: ComponentType;
	values: Record<string, any>;
	onChange: (newValues: Record<string, any>) => void;
}

/**
 * 自建表单渲染器
 * - 遍历 props 对象的每个字段
 * - 根据值的类型自动推断控件（boolean→Switch, number→InputNumber, string→Input/Select/Radio）
 * - 查 hints 注解表补中文标题、枚举、min/max 等
 */
export default function PropsFormRenderer({
	componentType,
	values,
	onChange,
}: PropsFormRendererProps) {
	const hints: FormHints = componentHintsRegistry[componentType] ?? {};

	const handleChange = useCallback(
		(key: string, val: any) => {
			onChange({ ...values, [key]: val });
		},
		[values, onChange]
	);

	const entries = Object.entries(values).filter(([key]) => {
		const hint = hints[key];
		return !hint?.hidden;
	});

	return (
		<div className="flex flex-col gap-3 p-3">
			{entries.map(([key, val]) => {
				const hint = hints[key];
				return (
					<FieldRow
						key={key}
						fieldKey={key}
						value={val}
						hint={hint}
						onChange={handleChange}
					/>
				);
			})}
		</div>
	);
}

interface FieldRowProps {
	fieldKey: string;
	value: any;
	hint?: FormHint;
	onChange: (key: string, val: any) => void;
}

function FieldRow({ fieldKey, value, hint, onChange }: FieldRowProps) {
	const label = hint?.title ?? fieldKey;
	const description = hint?.description;

	// 一行两列：左边 76px 放标题，右边放控件（原来是标题在上、控件在下，比较占高度）。
	// - items-start + 标题的 pt-1：小号控件高 24px，标题行高 16px，往下推 4px 正好和控件垂直居中；
	//   遇到多行文本框时标题则停在顶部，不会被拉到中间。
	// - 右列的 min-w-0：允许控件被压窄，避免长内容把面板撑出横向滚动条。
	return (
		<div className="grid grid-cols-[76px_minmax(0,1fr)] items-start gap-x-2">
			<label className="pt-1 text-xs leading-4 text-slate-500">{label}</label>
			<div className="min-w-0">
				<FieldControl fieldKey={fieldKey} value={value} hint={hint} onChange={onChange} />
				{description && (
					<p className="mt-1 text-[11px] leading-4 text-slate-400">{description}</p>
				)}
			</div>
		</div>
	);
}

function FieldControl({ fieldKey, value, hint, onChange }: FieldRowProps) {
	const type = typeof value;

	// color → ColorPicker（同时保留文字输入）
	if (hint?.widget === "color") {
		return (
			<ColorPicker
				size="small"
				value={value || "#ffffff"}
				showText
				format="hex"
				onChange={(_, hex) => onChange(fieldKey, hex)}
			/>
		);
	}

	// boolean → Switch
	if (type === "boolean") {
		return (
			<Switch
				size="small"
				checked={value}
				onChange={(checked) => onChange(fieldKey, checked)}
			/>
		);
	}

	// number with enum (fontWeight etc.) → Select
	if (type === "number" && hint?.enum && hint.enum.length > 0) {
		return (
			<Select
				size="small"
				className="w-full"
				value={value}
				onChange={(v) => onChange(fieldKey, v)}
				options={hint.enum.map((e) => ({ label: String(e), value: e }))}
			/>
		);
	}

	// number → InputNumber
	if (type === "number") {
		return (
			<InputNumber
				size="small"
				className="w-full"
				value={value}
				min={hint?.min}
				max={hint?.max}
				onChange={(v) => onChange(fieldKey, v ?? 0)}
			/>
		);
	}

	// string with enum → Radio / Select
	if (type === "string" && hint?.enum && hint.enum.length > 0) {
		if (hint.widget === "select" || hint.enum.length > 4) {
			return (
				<Select
					size="small"
					className="w-full"
					value={value}
					onChange={(v) => onChange(fieldKey, v)}
					options={hint.enum.map((e) => ({ label: String(e), value: e }))}
				/>
			);
		}
		return (
			<Radio.Group
				size="small"
				value={value}
				onChange={(e) => onChange(fieldKey, e.target.value)}
				optionType="button"
				buttonStyle="solid"
				options={hint.enum.map((e) => ({ label: String(e), value: e }))}
			/>
		);
	}

	// string → textarea / Input
	if (type === "string") {
		if (hint?.widget === "textarea") {
			return (
				<Input.TextArea
					size="small"
					rows={3}
					value={value}
					placeholder={hint?.placeholder}
					onChange={(e) => onChange(fieldKey, e.target.value)}
				/>
			);
		}
		return (
			<Input
				size="small"
				value={value}
				placeholder={hint?.placeholder}
				onChange={(e) => onChange(fieldKey, e.target.value)}
			/>
		);
	}

	// 复杂类型（array/object）不渲染
	return null;
}
