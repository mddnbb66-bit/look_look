import type { PageDSL } from "@/core/schema/page";
import type { ComponentNodeType } from "@/core/schema/ownType";

/**
 * useTreeOperation
 * @description 组件树结构增删改查操作
 * @returns
 */
export const useTreeOperation = () => {
	/**
	 * 判断节点是否具备 children 属性的类型守卫
	 * 使用类型守卫可以让 TS 正确收窄类型，在后续逻辑中安全访问 children
	 * @param node 当前遍历到的节点
	 * @returns 是否包含 children 数组
	 */
	// 判断节点是否具备 children 属性的类型守卫，避免在联合类型上直接访问 children
	const hasChildren = (
		node: ComponentNodeType | PageDSL
	): node is
		| (ComponentNodeType & { children: ComponentNodeType[] })
		| (PageDSL & { children: ComponentNodeType[] }) => {
		return Array.isArray((node as any).children);
	};

	/**
	 * 在组件树中根据 id 查找节点
	 * 采用深度优先遍历（DFS），一旦找到目标节点立即返回
	 * @param id 要查找的节点 id
	 * @param node 当前遍历到的根节点
	 * @returns 找到的节点，找不到则为 null
	 */
	// 返回查找到的节点对象数据
	const findNodeById = (
		id: string, //要找的目标id
		node: ComponentNodeType | PageDSL | null //当前检查的节点，一开始都是root,仅仅凭个id是找不到的，剩下的方法全是
	): ComponentNodeType | PageDSL | null => {
		if (!node) return null;
		if (node.id === id) return node;

		// 只要节点存在 children 就继续向下查找，不再依赖 type 字段
		// 这里使用 DFS 遍历所有子节点
		if (hasChildren(node)) {
			for (const child of node.children) {
				const found = findNodeById(id, child);
				if (found) return found;
			}
		}
		return null;
	};

	/**
	 * 在指定父节点下插入子节点
	 * 会在整棵树中查找 parentId 对应的节点并插入 newNode
	 * @param parentId 父节点 id
	 * @param root 当前整在检查的节点，第一次通常为schema 不能缺少根节点，因为schemas是整个树的入口，只有id的话会不知道往哪里插入
	 * @param newNode 要插入的组件节点
	 * @returns 是否插入成功
	 */
	const addNodeToParent = (
		parentId: string,
		node: ComponentNodeType | PageDSL,
		newNode: ComponentNodeType
	): boolean => {
		if (node.id === parentId) {
			// 有children数组就加入，没有就初始化
			if (hasChildren(node)) {
				node.children.push(newNode);
			} else {
				(node as any).children = [newNode];
			}
			return true;
		}
		// 未命中则向子节点递归查找
		if (hasChildren(node)) {
			for (const child of node.children) {
				if (addNodeToParent(parentId, child, newNode)) {
					return true;
				}
			}
		}

		return false;
	};

	/**
	 * 根据 id 从树中删除节点
	 * 仅修改 children 数组，不会删除根节点自身
	 * @param id 要删除的节点 id
	 * @param node  当前整在检查的节点，第一次通常为schema 不能缺少根节点，因为schemas是整个树的入口，只有id的话会不知道往哪里插入
	 * @returns 是否删除成功
	 */
	const removeNodeById = (id: string, node: ComponentNodeType | PageDSL): boolean => {
		if (!hasChildren(node)) return false;

		const index = node.children.findIndex((child) => child.id === id);

		if (index !== -1) {
			//走到这里说明当前层级又要删除的东西
			node.children.splice(index, 1);
			return true;
		}
		//走到这里说明当前层级没有要删除的
		for (const child of node.children) {
			if (removeNodeById(id, child)) {
				return true;
			}
		}

		return false;
	};
	// 	如果当前 root 的直接子节点中找到了目标：
	//     删除它并返回 true
	// 否则：
	//     递归搜索每个子节点
	//     如果递归删除成功，返回 true
	//     全部失败后返回 false

	/**
	 * 根据 id 更新树中的节点属性
	 * 会对命中的节点执行浅层 Object.assign
	 * @param id 要更新的节点 id
	 * @param root 遍历的根节点
	 * @param updates 要合并到节点上的属性
	 * @returns 是否更新成功
	 */
	const updateNodeById = (
		id: string,
		node: ComponentNodeType | PageDSL,
		updates: Partial<ComponentNodeType>
	): boolean => {
		if (node.id === id) {
			// 命中目标节点，直接合并属性
			Object.assign(node, updates);
			return true;
		}
		if (hasChildren(node)) {
			// 未命中则递归子节点
			for (const child of node.children) {
				if (updateNodeById(id, child, updates)) {
					return true;
				}
			}
		}

		return false;
	};

	return {
		findNodeById,
		addNodeToParent,
		removeNodeById,
		updateNodeById,
	};
};
