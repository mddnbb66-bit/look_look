import { create } from "zustand";
import { immer } from "zustand/middleware/immer";

type Orientation = "x" | "y";

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
