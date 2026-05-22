import { componentRegistry, type RegistryComponent } from "@/components/materials/registry";
import type { ComponentNode } from "../schema/basic";
import type { PageDSL } from "../schema/page";
import RndItem from "../rnd/RndItem";

interface RendererProps {
	// schema 可以是单个组件，也可以是组件数组，或者是整个页面schema
	schema: ComponentNode | ComponentNode[] | PageDSL;
	mode?: "edit" | "preview";
	scale?: number;
}

/**
 * 渲染器，递归渲染组件树
 * @param schema 组件的schema
 */
export default function Renderer({
	schema,
	mode = "edit",
	scale = 1,
}: RendererProps): React.ReactNode {
	if (!schema) {
		return null;
	}
	// 如果scheme是一个数组，说明传入了children，遍历children渲染
	if (Array.isArray(schema)) {
		return schema.map((node) => (
			<Renderer key={node.id} schema={node} mode={mode} scale={scale} />
		));
	}

	// 在组件注册表中查找对应类型的组件
	const renderComponent: RegistryComponent =
		componentRegistry.get(schema.type) || componentRegistry.get("error-callback");

	// 这里的 renderChildren 是为了让容器组件能够回调引擎来渲染它的子节点
	// 实现了 "控制反转"，容器不需要知道子节点具体是什么类型
	const renderChildren = (children: ComponentNode[]) => (
		<Renderer schema={children} mode={mode} scale={scale} />
	);

	// 1. 非preview模式：根容器占满画布本身，不参与 Rnd 拖拽
	if ((schema as PageDSL).type === "RootContainer") {
		return renderComponent({
			node: schema,
			renderChildren,
			mode,
		});
	}

	// 获取当前渲染节点的schema配置
	const node = schema as ComponentNode;
	// 获取当前渲染节点schema配置中的样式数据，并进行空值兜底
	const style = node.style ?? {
		top: 0,
		left: 0,
		width: 200,
		height: 50,
		zIndex: 1,
	};

	const { top, left, width, height, zIndex, ...restStyle } = style;

	// 2. preview模式：所有组件以绝对定位方式渲染，不参与 Rnd 拖拽
	if (mode === "preview") {
		return (
			<div
				style={{
					position: "absolute",
					top,
					left,
					width,
					height,
					zIndex,
					...restStyle,
				}}
			>
				{renderComponent({
					node,
					renderChildren,
					mode,
				})}
			</div>
		);
	}

	// 3. 非preview模式且非根容器：普通组件统一通过 RndItem 包裹，使其在画布内可拖拽 / 缩放
	return (
		<RndItem node={node} scale={scale}>
			{renderComponent({
				node,
				renderChildren,
			})}
		</RndItem>
	);
}
