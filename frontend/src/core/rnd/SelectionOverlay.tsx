interface SelectionOverlayProps {
	/** 组件显示名称 */
	name: string;
	/** 组件靠近画布顶部时标签需要翻转到下方 */
	isNearTop: boolean;
	/** 删除按钮回调 */
	onDelete: () => void;
	/** 取消选中回调 */
	onDeselect: () => void;
}

/**
 * 选中态覆盖层：蓝色边框 + 名称标签 + 删除/取消操作按钮
 *
 * 颜色都读 index.css 里的 CSS 变量（--vc-accent / --vc-danger / --vc-ink），
 * 这样换主题色时不用到这里改十六进制值。
 */
export default function SelectionOverlay({
	name,
	isNearTop,
	onDelete,
	onDeselect,
}: SelectionOverlayProps) {
	return (
		<>
			{/* 四边全包围的高亮边框 */}
			<div
				style={{
					position: "absolute",
					inset: 0,
					border: "1px solid var(--vc-accent)",
					boxShadow: "0 0 0 1px rgba(59,118,246,0.25)",
					//圆角
					borderRadius: 2,
					//这个元素不接受鼠标/指针的命中
					pointerEvents: "none",
				}}
			/>

			{/* 名称标签：靠近顶部时翻转到组件下方 */}
			<div
				style={{
					position: "absolute",
					...(isNearTop ? { bottom: -20, left: 0 } : { top: -18, left: 0 }),
					padding: "0 6px",
					height: 16,
					lineHeight: "16px",
					fontSize: 12,
					backgroundColor: "var(--vc-accent)",
					color: "#ffffff",
					borderRadius: 2,
					whiteSpace: "nowrap",
				}}
			>
				{name}
			</div>

			{/* 操作按钮区域 */}
			<div
				style={{
					position: "absolute",
					...(isNearTop ? { bottom: -20, right: 0 } : { top: -18, right: 0 }),
					display: "flex",
					gap: 4,
				}}
			>
				<div
					style={{
						padding: "0 6px",
						height: 16,
						lineHeight: "16px",
						fontSize: 12,
						backgroundColor: "var(--vc-danger)",
						color: "#ffffff",
						borderRadius: 2,
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={(event) => {
						event.stopPropagation();
						onDelete();
					}}
				>
					删除
				</div>

				<div
					style={{
						padding: "0 6px",
						height: 16,
						lineHeight: "16px",
						fontSize: 12,
						backgroundColor: "var(--vc-ink)",
						color: "#ffffff",
						borderRadius: 2,
						cursor: "pointer",
						userSelect: "none",
					}}
					onClick={(event) => {
						event.stopPropagation();
						onDeselect();
					}}
				>
					取消
				</div>
			</div>
		</>
	);
}
