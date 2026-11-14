// 默认网格尺寸（同时充当吸附阈值）
export const DEFAULT_GRID_SIZE = 15;
// 吸附阈值
export const DEFAULT_SNAP_SIZE = 5;
/**
 * 规范化 DSL 中的网格尺寸 / 吸附阈值
 * - 非法值回退到默认 15px，避免拖拽计算异常
 */
export function normalizeGridSize(gridSize?: number): number {
	// 只接受大于 0 的有限数；否则回退默认值
	if (typeof gridSize === "number" && Number.isFinite(gridSize) && gridSize > 0) {
		return gridSize;
	}
	return DEFAULT_GRID_SIZE;
}

/**
 * 将数值吸附到网格
 * - gridSize 同时作为网格步进与吸附阈值
 * - 当距离最近网格线不超过阈值时吸附，否则维持原值
 * @param value 原始画布的坐标 ，
 * @param gridSize 网格尺寸
 * @returns
 */
export function snapToGrid(originPosition: number, gridSize?: number) {
	// 一个网格的边长
	const step = normalizeGridSize(gridSize);
	// 原位置超过前一条网格线的距离。
	const extra = originPosition % step;
	// 其中一个候选网格位置
	const lower = originPosition - extra;
	//距离前后格子的距离
	const lowerdistance = Math.abs(extra);
	const upperdistance = Math.abs(step - extra);

	// 距离相同时，沿用原版：选择 lower
	// 	离前一个候选格子更近或一样近 → 前一个
	// 否则            → 选后一个
	// 最终吸附的线是前一个还是后一个
	const snapPosition = lowerdistance <= upperdistance ? lower : lower + step;
	//距离前一个或后一个网格线 ≤ 5px：吸附
	// 距离两边都 > 5px：不吸附
	//看看能不能吸附，距离左右2边<=5px才开始吸附，剩下就随便摆放了
	const isSnapped = Math.min(lowerdistance, upperdistance) < DEFAULT_SNAP_SIZE ? true : false;
	return {
		originPosition: isSnapped ? snapPosition : originPosition,
		isSnapped,
		step,
	};
}
