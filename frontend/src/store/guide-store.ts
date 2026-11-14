// 当前需要显示哪些线
import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type Orientation = "x" | "y";

// activeSnaps     // 当前需要显示的参考线数组
// // setActiveSnaps  // 更新这份数组的方法
// setActiveSnaps([
// 	{ orientation: "x", value: 120 },
// 	{ orientation: "y", value: 90 },
// ]);
// 的意思是	在画布横坐标120处画一条竖线	在画布纵坐标90处画一条横线
interface GuideState {
	activeSnaps: { orientation: Orientation; value: number }[]; // 即时吸附到的网格线位置
	setActiveSnaps: (snaps: { orientation: Orientation; value: number }[]) => void; // 设置当前吸附位置（高亮用）
}

/**
 * 网格吸附高亮状态容器
 * - 仅记录当前被命中的网格线，用于 GuideLayer 高亮
 */
export const useGuideStore = create<GuideState>()(
	immer((set) => ({
		activeSnaps: [],

		setActiveSnaps: (snaps) => {
			set((state) => {
				state.activeSnaps = snaps;
			});
		},
	}))
);
// RndItem：拖动时获得位置
//     ↓
// grid工具：计算吸附位置及是否吸附
//     ↓
// guide-store：保存这次要显示的线
//     ↓
// GuideLayer：读取数据，把线画出来
