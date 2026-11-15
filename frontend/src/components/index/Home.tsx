import { ArrowRight, Layers, BarChart3, Eye } from "lucide-react";

/**
 * 首页
 * ------------------------------------------------------------------
 * 结构从上到下只有四块：导航 → 标题区 → 编辑器示意图 → 三个特点。
 *
 * 设计上的取舍：
 * - 整页只有黑、白、灰，唯一的颜色是示意图里那个「被选中」的蓝框
 * - 不用渐变、光晕、胶囊标签、带阴影的卡片；层次靠字号、字重和细线来分
 * - 示意图画的就是这个产品的编辑器本身（三栏布局），而不是和产品无关的装饰图
 */

// 三个特点。写成组件外的常量：内容固定不变，不需要每次渲染都重新创建
const highlights = [
	{
		title: "所见即所得的可视化搭建",
		desc: "把组件从物料库拖到画布上，直接拖动调整位置和尺寸，自动吸附到网格。",
		icon: <Layers className="h-4 w-4" />,
	},
	{
		title: "基础组件与 ECharts 图表",
		desc: "内置文字、图片、指标卡等基础组件，以及柱状、折线、饼图等多种图表。",
		icon: <BarChart3 className="h-4 w-4" />,
	},
	{
		title: "保存与预览",
		desc: "编辑结果保存到后端，随时切换到预览模式查看大屏的实际效果。",
		icon: <Eye className="h-4 w-4" />,
	},
];

// 示意图里柱状图每根柱子的高度（百分比）
const barHeights = [42, 68, 54, 82, 61, 96, 73];

/**
 * 编辑器示意图：用纯 div 画出来的「缩小版编辑器」
 * - 纯装饰，所以加 aria-hidden（读屏软件会跳过）和 select-none（文字不能被选中）
 * - 外壳（顶栏、左右面板）全部用灰色色块代替真实内容，只有中间的大屏是有内容的
 * - 中间那块深色的就是用户要搭的「数据大屏」，其中第一张指标卡画成了选中状态
 */
function EditorSketch() {
	return (
		<div
			aria-hidden
			className="select-none overflow-hidden rounded-lg border border-slate-200 bg-white"
		>
			{/* 顶栏：左边是标识和项目名，右边是「预览」「保存」两个按钮的轮廓 */}
			<div className="flex h-10 items-center justify-between border-b border-slate-200 px-3">
				<div className="flex items-center gap-2">
					<div className="h-5 w-5 rounded bg-slate-900" />
					<div className="h-2 w-24 rounded-full bg-slate-200" />
				</div>
				<div className="flex items-center gap-2">
					<div className="h-6 w-14 rounded-md border border-slate-200" />
					<div className="h-6 w-14 rounded-md bg-slate-900" />
				</div>
			</div>

			{/* 主体三栏。小屏幕（md 以下）只显示中间的画布，两侧面板隐藏 */}
			<div className="grid h-[440px] grid-cols-1 md:grid-cols-[196px_minmax(0,1fr)_216px]">
				{/* 左栏：分类窄栏 + 物料格子 */}
				<div className="hidden border-r border-slate-200 md:flex">
					<div className="flex w-11 flex-col items-center gap-2 border-r border-slate-200 py-3">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<div
								key={i}
								className={`h-7 w-7 rounded-md ${i === 0 ? "bg-slate-200" : "bg-slate-100"}`}
							/>
						))}
					</div>
					<div className="grid flex-1 grid-cols-2 content-start gap-2 p-3">
						{[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
							<div key={i} className="h-12 rounded-md bg-slate-100" />
						))}
					</div>
				</div>

				{/* 中栏：灰色工作区 + 深色大屏。pb-12：底部多留一些灰色，给左下角的缩放控件腾位置 */}
				<div className="relative bg-slate-200/70 p-5 pb-12">
					<div className="flex h-full flex-col gap-3 bg-slate-900 p-4 shadow-artboard">
						<div className="flex items-baseline justify-between">
							<span className="text-sm font-medium text-white">销售数据大屏</span>
							<span className="text-[11px] text-slate-500">示例数据</span>
						</div>

						{/* 三张指标卡。mt-2：上方多留一点空，放得下选中卡片左上角的名称标签 */}
						<div className="mt-2 grid grid-cols-3 gap-3">
							{/* 第一张是选中状态：蓝色描边 + 左上角名称标签 + 四个角的控制点 */}
							<div className="relative rounded bg-white/5 p-3 outline outline-1 outline-brand-400">
								<span className="absolute -top-4 left-0 rounded-sm bg-brand-500 px-1 text-[10px] leading-4 text-white">
									指标卡
								</span>
								{/* 四个控制点：绝对定位到四个角，各往外偏 3px */}
								<span className="absolute -left-[3px] -top-[3px] h-1.5 w-1.5 border border-brand-400 bg-white" />
								<span className="absolute -right-[3px] -top-[3px] h-1.5 w-1.5 border border-brand-400 bg-white" />
								<span className="absolute -bottom-[3px] -left-[3px] h-1.5 w-1.5 border border-brand-400 bg-white" />
								<span className="absolute -bottom-[3px] -right-[3px] h-1.5 w-1.5 border border-brand-400 bg-white" />
								<div className="text-[11px] text-slate-400">今日销售额</div>
								<div className="mt-1 text-lg font-semibold tabular-nums text-white">
									128,430
								</div>
							</div>
							<div className="rounded bg-white/5 p-3">
								<div className="text-[11px] text-slate-400">订单数</div>
								<div className="mt-1 text-lg font-semibold tabular-nums text-white">
									3,275
								</div>
							</div>
							<div className="rounded bg-white/5 p-3">
								<div className="text-[11px] text-slate-400">转化率</div>
								<div className="mt-1 text-lg font-semibold tabular-nums text-white">
									4.8%
								</div>
							</div>
						</div>

						{/* 两张图表：左边柱状图，右边折线图。min-h-0 + flex-1 让它们占满剩余高度 */}
						<div className="grid min-h-0 flex-1 grid-cols-2 gap-3">
							<div className="flex flex-col rounded bg-white/5 p-3">
								<div className="text-[11px] text-slate-400">近 7 日销售额</div>
								{/* items-end：柱子从底部往上长 */}
								<div className="mt-3 flex min-h-0 flex-1 items-end gap-2">
									{barHeights.map((h, i) => (
										<div
											key={i}
											className="flex-1 rounded-sm bg-brand-400"
											style={{ height: `${h}%` }}
										/>
									))}
								</div>
							</div>
							<div className="flex flex-col rounded bg-white/5 p-3">
								<div className="text-[11px] text-slate-400">访问趋势</div>
								{/* preserveAspectRatio="none"：让折线跟着容器任意拉伸，始终铺满 */}
								<svg
									className="mt-3 min-h-0 w-full flex-1"
									viewBox="0 0 200 80"
									preserveAspectRatio="none"
								>
									<polyline
										points="0,62 28,50 56,56 84,34 112,40 140,20 168,28 200,10"
										fill="none"
										stroke="#6096fa"
										strokeWidth="2"
										vectorEffect="non-scaling-stroke"
									/>
								</svg>
							</div>
						</div>
					</div>

					{/* 左下角的缩放控件轮廓 */}
					<div className="absolute bottom-3 left-5 h-6 w-28 rounded-md bg-white shadow-float" />
				</div>

				{/* 右栏：属性面板。一行 = 一个短的标题条 + 一个长的输入框 */}
				<div className="hidden border-l border-slate-200 md:block">
					<div className="flex h-9 items-center gap-4 border-b border-slate-200 px-3">
						<div className="h-2 w-8 rounded-full bg-slate-900" />
						<div className="h-2 w-8 rounded-full bg-slate-200" />
						<div className="h-2 w-8 rounded-full bg-slate-200" />
					</div>
					<div className="space-y-2.5 p-3">
						{[0, 1, 2, 3, 4, 5].map((i) => (
							<div key={i} className="flex items-center gap-2">
								<div className="h-2 w-10 rounded-full bg-slate-200" />
								<div className="h-6 flex-1 rounded bg-slate-100" />
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}

export default function Home() {
	return (
		// body 在 index.css 里设了 overflow: hidden（编辑器需要），
		// 所以首页要自己负责滚动：固定为一屏高（h-screen），内容超出时在内部滚（overflow-y-auto）
		<div className="h-screen overflow-y-auto bg-white text-slate-900">
			{/* 导航 */}
			<header className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
				<div className="flex items-center gap-2.5">
					<div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold tracking-wide text-white">
						VC
					</div>
					<span className="text-[15px] font-semibold">Vision-Craft</span>
				</div>
				<nav>
					<a href="/auth" className="vc-btn-ghost h-8 px-3 text-[13px]">
						登录 / 注册
					</a>
				</nav>
			</header>

			{/* 标题区：小字说明是什么 → 大标题 → 一段描述 → 唯一的主按钮 */}
			<section className="mx-auto max-w-6xl animate-fade-in px-6 pb-12 pt-14">
				<p className="text-sm font-medium text-slate-500">数据大屏搭建工具</p>
				{/* tracking-tight：大字号时把字距收紧一点，标题更紧凑 */}
				<h1 className="mt-3 text-4xl font-semibold leading-tight tracking-tight lg:text-5xl lg:leading-[1.15]">
					拖拽组件，
					<br />
					搭出一块数据大屏
				</h1>
				<p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600">
					从物料库拖入组件，在画布上调整位置和尺寸，在右侧面板配置属性与数据源。内置
					ECharts 图表，也可以用 AI 对话生成页面。
				</p>
				<div className="mt-8">
					<a href="/auth" className="vc-btn h-10 px-5">
						开始使用
						<ArrowRight className="h-4 w-4" />
					</a>
				</div>
			</section>

			{/* 编辑器示意图 */}
			<section className="mx-auto max-w-6xl animate-slide-up px-6">
				<EditorSketch />
			</section>

			{/* 三个特点：不套卡片，每一列顶部一条细线，下面是标题和说明 */}
			<section className="mx-auto grid max-w-6xl grid-cols-1 gap-x-10 gap-y-8 px-6 py-16 md:grid-cols-3">
				{highlights.map((item) => (
					<div key={item.title} className="border-t border-slate-200 pt-5">
						<div className="flex items-center gap-2 text-sm font-semibold">
							<span className="text-slate-400">{item.icon}</span>
							{item.title}
						</div>
						<p className="mt-2 text-sm leading-relaxed text-slate-600">{item.desc}</p>
					</div>
				))}
			</section>
		</div>
	);
}
