const STEPS = [10, 20, 50, 100, 200, 500];

interface RulerProps {
	orientation: "x" | "y"; //这是哪一把标尺
	length: number; // 画布这条边多长：横向传 width，竖向传 height
	scale: number; //现在的缩放倍率
	scroll: number; // 工作区在这个方向上滚了多远：横向传 scrollLeft，竖向传 scrollTop
}

export function Ruler({ orientation, length, scale, scroll }: RulerProps) {
	const isX = orientation === "x";

	// 1. 选刻度间隔：屏幕上至少隔 50px，数字才不挤
	const step = STEPS.find((s) => s * scale >= 50) ?? 500;
	const minor = step / 5; // 每格再分 5 小格

	// 2. 从 0 到画布边长，每一小格一条线
	const ticks: number[] = [];
	for (let v = 0; v <= length; v += minor) ticks.push(v);

	return (
		<div
			className={`absolute z-20 select-none overflow-hidden bg-white text-[10px] text-slate-400 border-slate-200 ${
				isX ? "left-7 right-0 top-0 h-7 border-b" : "left-0 top-7 bottom-0 w-7 border-r"
			}`}
		>
			{ticks.map((v) => {
				const pos = v * scale - scroll; // 3. 画布坐标 → 屏幕位置
				const major = v % step === 0;
				const size = major ? 28 : 6;
				return (
					<div
						key={v}
						className={`absolute ${major ? "bg-slate-300" : "bg-slate-200"}`}
						style={
							isX
								? { left: pos, top: 0, width: 1, height: size }
								: { top: pos, left: 0, height: 1, width: size }
						}
					>
						{major && (
							<span
								className="absolute left-0.5 top-0.5"
								style={isX ? undefined : { writingMode: "vertical-rl" }}
							>
								{v}
							</span>
						)}
					</div>
				);
			})}
		</div>
	);
}
export const RULER_THICKNESS = 28;

// const STEPS = [10, 20, 50, 100, 200, 500];

// interface RulerProps {
//   orientation: "x" | "y";	哪一个标尺
//   length: number; // 画布这条边多长：横向传 width，竖向传 height
//   scale: number;
//   scroll: number; // 横向传 scrollLeft，竖向传 scrollTop
// }

// export function Ruler({ orientation, length, scale, scroll }: RulerProps) {
//   const isX = orientation === "x";

//   // 1. 选刻度间隔：屏幕上至少隔 50px，数字才不挤
//   const step = STEPS.find((s) => s * scale >= 50) ?? 500;
//   const minor = step / 5; // 每格再分 5 小格

//   // 2. 从 0 到画布边长，每一小格一条线
//   const ticks: number[] = [];
//   for (let v = 0; v <= length; v += minor) ticks.push(v);

//   return (
//     <div
//       className={`absolute z-20 select-none overflow-hidden bg-white text-[10px] text-slate-400 border-slate-200 ${
//         isX ? "left-7 right-0 top-0 h-7 border-b" : "left-0 top-7 bottom-0 w-7 border-r"
//       }`}
//     >
//       {ticks.map((v) => {
//         const pos = v * scale - scroll; // 3. 画布坐标 → 屏幕位置
//         const major = v % step === 0;
//         const size = major ? 28 : 6;
//         return (
//           <div
//             key={v}
//             className={`absolute ${major ? "bg-slate-300" : "bg-slate-200"}`}
//             style={
//               isX
//                 ? { left: pos, top: 0, width: 1, height: size }
//                 : { top: pos, left: 0, height: 1, width: size }
//             }
//           >
//             {major && (
//               <span
//                 className="absolute left-0.5 top-0.5"
//                 style={isX ? undefined : { writingMode: "vertical-rl" }}
//               >
//                 {v}
//               </span>
//             )}
//           </div>
//         );
//       })}
//     </div>
//   );
// }
