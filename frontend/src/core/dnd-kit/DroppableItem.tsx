import { useDroppable } from "@dnd-kit/core";
import { useRef } from "react";

interface DroppableItemProps {
	id: string;
	children: React.ReactNode;
	style?: React.CSSProperties;
}

export default function DroppableItem({ id, children, style }: DroppableItemProps) {
	const nodeRef = useRef<HTMLDivElement | null>(null);
	// 透出滚动与位置，便于落点计算补偿滚动偏移
	const { setNodeRef, isOver } = useDroppable({
		id,
		data: {
			getScrollOffset: () => ({
				left: nodeRef.current?.scrollLeft ?? 0,
				top: nodeRef.current?.scrollTop ?? 0,
			}),
			getBoundingClientRect: () => nodeRef.current?.getBoundingClientRect(),
		},
	});

	const handleRef = (node: HTMLDivElement | null) => {
		nodeRef.current = node;
		setNodeRef(node);
	};

	const defaultStyle = isOver ? { backgroundColor: "green", opacity: 0.7 } : {};
	const finalStyle = { ...defaultStyle, ...style };

	return (
		<div ref={handleRef} style={finalStyle} className="h-full">
			{children}
		</div>
	);
}
