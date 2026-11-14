import { create } from "zustand";
import type { ComponentNodeType } from "@/core/schema/ownType";

/**
 * 组件级 AI 编辑请求的桥接 store
 * - RndItem 内联输入框写入 pending 请求
 * - AIChatPanel 消费并清除 pending 请求
 */
interface ComponentEditState {
	/** 待处理的组件编辑请求 */
	pendingEdit: {
		prompt: string;
		node: ComponentNodeType;
	} | null;
	/** 提交一个组件编辑请求 */
	setPendingEdit: (prompt: string, node: ComponentNodeType) => void;
	/** 消费后清除 */
	clearPendingEdit: () => void;
}

export const useComponentEditStore = create<ComponentEditState>()((set) => ({
	pendingEdit: null,
	setPendingEdit: (prompt, node) => set({ pendingEdit: { prompt, node } }),
	clearPendingEdit: () => set({ pendingEdit: null }),
}));
