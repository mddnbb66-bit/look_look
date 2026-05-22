import { useDraggable } from "@dnd-kit/core";

interface DraggableItemProps {
	id: string;
	children: React.ReactNode;
}

export default function DraggableItem({ id, children }: DraggableItemProps) {
	// 这里只负责注册拖拽源，id 表示「拖拽的类型或节点本身」，不在这里生成实例 id
	const { listeners, attributes, setNodeRef, transform } = useDraggable({
		id,
	});

	// 应用拖动时的偏移样式
	const style = transform
		? {
				transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
			}
		: undefined;

	return (
		<div ref={setNodeRef} style={style} {...attributes} {...listeners}>
			{children}
		</div>
	);
}
