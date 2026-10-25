import type { RendererProps } from "@/core/schema/commonType";
import type { TextComponentType } from "@/core/schema/ownType";

export default function TextComponent({ node }: RendererProps) {
	const props = node.props as TextComponentType["props"];
	const alignToCss = (align: TextComponentType["props"]["textAlign"]) =>
		align === "居中" ? "center" : align === "右" ? "right" : "left";
	return (
		<div
			style={{
				fontSize: props.fontSize + "px",
				fontWeight: props.fontWeight,
				color: props.color,
				textAlign: alignToCss(props.textAlign),
			}}
		>
			{props.content}
		</div>
	);
}
