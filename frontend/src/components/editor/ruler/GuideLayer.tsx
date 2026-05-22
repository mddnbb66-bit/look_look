import { useGuideStore } from "@/store/guide-store";
import { useShallow } from "zustand/shallow";

interface GuideLayerProps {
	scale: number; // 当前缩放比例
	width: number; // 画布宽度
	height: number; // 画布高度
}

/**
 * 参考线渲染层
 * - 覆盖在画布滚动容器内，与内容一起滚动
 * - 高亮由 store 控制，命中时改为实线
 */
export function GuideLayer({ scale, width, height }: GuideLayerProps) {
	const { activeSnaps } = useGuideStore(
		useShallow((state) => ({
			activeSnaps: state.activeSnaps,
		}))
	);

	const hasLines = activeSnaps.length > 0;
	if (!hasLines) return null;

	const LINE_WIDTH = 2;

	return (
		<div
			className="pointer-events-none absolute inset-0"
			style={{
				width,
				height,
				zIndex: 10,
			}}
		>
			{activeSnaps.map((snap, idx) => {
				const isX = snap.orientation === "x";
				const offset = snap.value * scale;
				const style = isX
					? {
							position: "absolute" as const,
							left: offset,
							top: 0,
							width: LINE_WIDTH,
							height: "100%",
							backgroundColor: "#2563eb",
							opacity: 0.9,
							pointerEvents: "none" as const,
						}
					: {
							position: "absolute" as const,
							top: offset,
							left: 0,
							height: LINE_WIDTH,
							width: "100%",
							backgroundColor: "#2563eb",
							opacity: 0.9,
							pointerEvents: "none" as const,
						};
				return <div key={`snap-${snap.orientation}-${idx}`} style={style} />;
			})}
		</div>
	);
}
