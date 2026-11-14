import { useDroppable } from "@dnd-kit/core";
import { useRef } from "react";
//把画布/容器组件注册成可放置区域
interface DroppableItemProps {
	id: string; //画布id
	children: React.ReactNode;
	style?: React.CSSProperties; //驼峰的css
}

export default function DroppableItem({ id, children, style }: DroppableItemProps) {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	// 透出滚动与位置，便于落点计算补偿滚动偏移
	/**
	 * @param isOver 表示当前是否有拖拽元素悬停在这个区域上 true  = 正在悬停
	 */
	const { setNodeRef, isOver } = useDroppable({
		id,
		data: {
			// nodeRef.current指的是包皮
			getScrollOffset: () => ({
				left: nodeRef.current?.scrollLeft ?? 0,
				top: nodeRef.current?.scrollTop ?? 0,
			}),
			// 它返回当前 DOM 相对于浏览器视口的位置和尺寸。
			//给落点计算提供接收区域的位置
			getBoundingClientRect: () => nodeRef.current?.getBoundingClientRect(),
		},
	});
	// React 把包装 div A 传给 handleRef
	const handleRef = (node: HTMLDivElement | null) => {
		nodeRef.current = node; //我们之后用它调用 getBoundingClientRect()	自己存一份，之后可以拿它测位置
		setNodeRef(node); //告诉 dnd-kit：这个就是接收拖拽的 DOM
	};
	// 设置悬停时的默认样式 绿色
	const defaultStyle = isOver ? { backgroundColor: "green", opacity: 0.7 } : {};
	const finalStyle = { ...defaultStyle, ...style };

	return (
		<div ref={handleRef} style={finalStyle} className="h-full">
			{/* 这个东西是工作区 */}
			{children}
		</div>
	);
}

{
	/* 
<DroppableItem id={schema.id}>			<div ref={handleRef} style={finalStyle} className="h-full">
	<div id="viewport">						<div id="viewport">
		<Renderer schema={schema} />  ===		<Renderer schema={schema} />
	</div>									</div>
</DroppableItem>; 						</div>
*/
}

// Children:
{
	/* <div id="viewport">
  <Renderer schema={schema} />
</div> */
}
