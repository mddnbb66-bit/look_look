import { Tag as AntTag } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { TagComponentType } from "@/core/schema/ownType";

export default function TagComponent({ node }: RendererProps) {
	const props = node.props as TagComponentType["props"];

	return (
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
			}}
		>
			<AntTag
				color={props.color}
				bordered={props.bordered}
				style={{ fontSize: props.fontSize }}
			>
				{props.text}
			</AntTag>
		</div>
	);
}
