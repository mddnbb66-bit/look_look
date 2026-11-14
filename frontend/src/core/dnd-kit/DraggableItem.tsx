import { useDraggable } from "@dnd-kit/core";
//左侧组件,拖拽源	也就是谁可以拖
interface DraggableItemProps {
	id: string;
	children: React.ReactNode;
}

export default function DraggableItem({ id, children }: DraggableItemProps) {
	// 这里只负责注册拖拽源，id 表示「拖拽的类型或节点本身」，不在这里生成实例 id
	const { listeners, attributes, setNodeRef, transform } = useDraggable({
		id,
	});
	// listeners:让元素能接收拖拽操作
	//attributes：一些默认的属性比如 role,比如tabIndex
	// setNodeRef:告诉库“具体拖哪个元素” 直接用ref 挂载
	// transform: 当前拖动的位移数据	{ x: 80, y: 20 }
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
// <DraggableItem id={type}>		<DraggableItem componentType="Text">
//   <div>文字组件</div>  ====			children={<div>文字组件</div>}/>
// </DraggableItem>					</DraggableItem>
// 它本身不负责创建组件实例，也不负责修改 schema，只是告诉 dnd-kit：
// 这个元素可以被拖动，它代表 Text 类
// 我用 dnd-kit 拖拽库实现左侧物料拖入画布。通过 useDraggable 注册拖拽源，useDroppable 注册接收区域，用 DndContext 统一处理拖拽事件。松手后根据物料类型创建节点配置，计算画布中的落点，生成唯一 id，再写入 Zustand 的 Schema，最后由 Renderer 渲染出
