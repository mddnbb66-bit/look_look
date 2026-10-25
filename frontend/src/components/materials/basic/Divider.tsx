import { Divider as AntDivider } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { DividerComponentType } from "@/core/schema/ownType";

export default function DividerComponent({ node }: RendererProps) {
	const props = node.props as DividerComponentType["props"];

	return (
		<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center" }}>
			<AntDivider
				type={props.direction}
				orientation={props.textPosition}
				style={{
					borderColor: props.color,
					borderStyle: props.lineStyle,
					margin: 0,
				}}
			>
				{props.text || undefined}
			</AntDivider>
		</div>
	);
}
