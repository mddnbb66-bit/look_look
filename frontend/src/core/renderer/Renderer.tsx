import { componentRegistryMap, type RegistryComponent } from "@/components/materials/registry";
import type { ComponentNodeType } from "../schema/ownType";
import type { PageDSL } from "../schema/page";
import RndItem from "../rnd/RndItem";

interface RendererProps {
	// schema 可以是单个组件，也可以是组件数组，或者是整个页面schema
	schema: ComponentNodeType | ComponentNodeType[] | PageDSL;
	mode?: "edit" | "preview";
	scale?: number;
}

// 组件没有 style 时使用的默认位置和大小
const DEFAULT_STYLE = { top: 0, left: 0, width: 200, height: 50, zIndex: 1 };

// 注册表查不到这个类型时显示提示，不负责捕获组件内部的运行错误
const UnknownComponent: RegistryComponent = ({ node }) => (
	<div style={{ color: "red" }}>未知组件：{node.type}</div>
);

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
	const RenderComponent = componentRegistryMap.get(schema.type) ?? UnknownComponent;

	// 这里的 renderChildren 是为了让容器组件能够回调引擎来渲染它的子节点
	// 实现了 "控制反转"，容器不需要知道子节点具体是什么类型
	const renderChildren = (children: ComponentNodeType[]) => (
		<Renderer schema={children} mode={mode} scale={scale} />
	);

	// 用 JSX 交给 React 渲染，让各物料组件独立管理自己的 Hook
	const content = <RenderComponent node={schema} renderChildren={renderChildren} mode={mode} />;

	// 1. 根容器在编辑和预览模式下都不额外包裹定位层或 RndItem
	if (schema.type === "RootContainer") return content;

	// 2. preview模式：所有组件以绝对定位方式渲染，不参与 Rnd 拖拽
	if (mode === "preview") {
		return (
			<div style={{ position: "absolute", ...(schema.style ?? DEFAULT_STYLE) }}>
				{content}
			</div>
		);
	}

	// 3. 非preview模式且非根容器：普通组件统一通过 RndItem 包裹，使其在画布内可拖拽 / 缩放
	return (
		<RndItem node={schema} scale={scale}>
			{content}
		</RndItem>
	);
}
