import { Tag as AntTag } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { TagComponent } from "@/core/schema/ownType";

export default function Tag({ node }: RendererProps) {
	const props = node.props as TagComponent["props"];

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
