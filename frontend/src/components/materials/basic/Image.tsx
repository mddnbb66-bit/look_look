import { Image as AntImage } from "antd";
import type { RendererProps } from "@/core/schema/types";
import type { ImageComponent } from "@/core/schema/basic";

/**
 * 图片组件渲染实现，基于 antd Image 包装
 */
export default function Image({ node }: RendererProps) {
	const props = node.props as ImageComponent["props"];

	// 使用类型断言确保 node 有 style 属性
	const componentNode = node as ImageComponent;

	return (
		<AntImage
			src={props.src}
			alt={props.alt}
			width="100%"
			height="100%"
			preview={props.preview}
			style={{
				borderRadius: componentNode.style?.borderRadius ?? 0,
				objectFit: props.fit,
			}}
			fallback="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='300' height='200'></svg>"
		/>
	);
}
