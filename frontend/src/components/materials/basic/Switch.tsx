import { Switch as AntSwitch } from "antd";
import type { RendererProps } from "@/core/schema/commonType";
import type { SwitchComponentType } from "@/core/schema/ownType";

export default function SwitchComponent({ node }: RendererProps) {
	const props = node.props as SwitchComponentType["props"];

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
			<AntSwitch
				checked={props.checked}
				checkedChildren={props.checkedText}
				unCheckedChildren={props.uncheckedText}
				size={props.size}
				disabled={props.disabled}
			/>
		</div>
	);
}
