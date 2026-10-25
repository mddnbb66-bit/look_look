import { Rate as AntRate } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { RateComponentType } from "@/core/schema/ownType";

export default function RateComponent({ node }: RendererProps) {
	const props = node.props as RateComponentType["props"];

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
			<AntRate
				value={props.value}
				count={props.count}
				allowHalf={props.allowHalf}
				disabled
				style={{
					color: props.color,
					fontSize: props.size,
				}}
			/>
		</div>
	);
}
