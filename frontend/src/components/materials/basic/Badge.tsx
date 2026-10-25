import { Badge as AntBadge } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { BadgeComponentType } from "@/core/schema/ownType";

export default function BadgeComponent({ node }: RendererProps) {
	const props = node.props as BadgeComponentType["props"];

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
			<AntBadge
				count={props.dot ? undefined : props.count}
				dot={props.dot}
				overflowCount={props.overflowCount}
				showZero={props.showZero}
				color={props.color}
			>
				<span style={{ fontSize: props.fontSize }}>{props.text}</span>
			</AntBadge>
		</div>
	);
}
