import { Avatar as AntAvatar } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { AvatarComponent } from "@/core/schema/ownType";

export default function Avatar({ node }: RendererProps) {
	const props = node.props as AvatarComponent["props"];

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
			<AntAvatar
				src={props.src || undefined}
				shape={props.shape}
				size={props.size}
				style={{
					backgroundColor: props.backgroundColor,
					color: props.color,
				}}
			>
				{!props.src ? props.text : undefined}
			</AntAvatar>
		</div>
	);
}
