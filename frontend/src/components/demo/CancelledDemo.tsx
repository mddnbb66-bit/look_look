import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Play, RotateCcw, Square, Timer } from "lucide-react";

/**
 * cancelled 标志位原理演示
 *
 * 这个页面用项目里真实的 listPages 接口，把「请求发出 → 组件卸载 → 请求返回」
 * 这条时间线完整演一遍。两种模式对比：
 *   - guarded：effect cleanup 里把 cancelled 置 true，await 恢复后先检查再决定要不要 setState
 *   - unguarded：没有这道关卡，请求回来直接对已卸载的组件 setState
 *
 * 注意：这里故意用 setTimeout 包住真实请求，纯粹为了把等待时间拉长到可观察的尺度，
 *       不改变 listPages 本身的行为。
 */

type Phase = "idle" | "mounted" | "requesting" | "unmounted" | "returned";

interface LogLine {
	id: string;
	time: string;
	text: string;
	kind: "info" | "ok" | "warn";
}

const PHASES: { key: Phase; label: string }[] = [
	{ key: "idle", label: "未挂载" },
	{ key: "mounted", label: "组件挂载" },
	{ key: "requesting", label: "发起请求" },
	{ key: "unmounted", label: "组件卸载" },
	{ key: "returned", label: "请求返回" },
];

const GUARDED_CODE = [
	"useEffect(() => {",
	"  let cancelled = false;",
	"  const fetchProjects = async () => {",
	"    const resp = await listPages(userId);",
	"    if (cancelled) return;",
	"    setProjects(resp.data);",
	"  };",
	"  fetchProjects();",
	"  return () => { cancelled = true; };",
	"}, []);",
];

const UNGUARDED_CODE = [
	"useEffect(() => {",
	"  const fetchProjects = async () => {",
	"    const resp = await listPages(userId);",
	"    setProjects(resp.data);",
	"  };",
	"  fetchProjects();",
	"  // 没有 cleanup，没有任何标记",
	"}, []);",
];

// 假的接口数据，只为让演示不依赖登录态和后端
const MOCK_PAGES = [
	{ pageId: "demo-1", title: "销售数据大屏" },
	{ pageId: "demo-2", title: "物流监控中心" },
	{ pageId: "demo-3", title: "用户增长看板" },
];

export default function CancelledDemo() {
	const navigate = useNavigate();

	const [mode, setMode] = useState<"guarded" | "unguarded">("guarded");
	const [phase, setPhase] = useState<Phase>("idle");
	const [cancelled, setCancelled] = useState(false);
	const [delay, setDelay] = useState(4000);
	const [logs, setLogs] = useState<LogLine[]>([]);
	const [resultCount, setResultCount] = useState<number | null>(null);

	const startedAtRef = useRef(0);
	const timerRef = useRef<number | null>(null);
	// 用 ref 存 cancelled，保证 setTimeout 回调里读到的是最新值
	const cancelledRef = useRef(false);
	// 用 ref 存 mode，避免把 mode 塞进 effect 依赖导致请求被反复重发
	const modeRef = useRef(mode);
	modeRef.current = mode;

	const addLog = useCallback((text: string, kind: LogLine["kind"] = "info") => {
		const elapsed = ((Date.now() - startedAtRef.current) / 1000).toFixed(1);
		// id 由当前列表长度派生，避免严格模式下 ref 自增导致 key 重复
		setLogs((prev) => [
			...prev,
			{ id: `${Date.now()}-${prev.length}`, time: `+${elapsed}s`, text, kind },
		]);
	}, []);

	const clearTimer = useCallback(() => {
		if (timerRef.current !== null) {
			window.clearTimeout(timerRef.current);
			timerRef.current = null;
		}
	}, []);

	const reset = useCallback(() => {
		clearTimer();
		cancelledRef.current = false;
		startedAtRef.current = Date.now();
		setPhase("idle");
		setCancelled(false);
		setLogs([]);
		setResultCount(null);
	}, [clearTimer]);

	// 切换模式时重置，保证两种模式的对比从同一起点开始
	useEffect(() => {
		reset();
	}, [mode, reset]);

	// 卸载时兜底清定时器，避免离开页面后还有回调在跑
	useEffect(() => clearTimer, [clearTimer]);

	/** 模拟组件挂载：effect 执行，发出真实请求 */
	const handleMount = useCallback(() => {
		clearTimer();
		cancelledRef.current = false;
		startedAtRef.current = Date.now();
		setCancelled(false);
		setResultCount(null);
		setLogs([]);
		setPhase("requesting");

		const guarded = modeRef.current === "guarded";
		addLog(
			guarded ? "effect 执行 → let cancelled = false" : "effect 执行 → 没有 cancelled 变量"
		);
		addLog("调用 listPages()，await 挂起…");

		// 用本地 mock 模拟一次慢请求：不依赖登录态，也不会被 403 踢去登录页。
		// 行为与真实 listPages 一致 —— 返回 { code, message, data }，只是数据是假的。
		const request = new Promise<{ code: number; data: unknown[] }>((resolve) => {
			timerRef.current = window.setTimeout(() => {
				resolve({ code: 0, data: MOCK_PAGES });
			}, delay);
		});

		void request.then((resp) => {
			const count = Array.isArray(resp.data) ? resp.data.length : 0;

			// 关键判断：这一轮请求是否已经作废
			if (guarded && cancelledRef.current) {
				setPhase("returned");
				addLog("await 恢复 → if (cancelled) return;", "ok");
				addLog("关卡生效：直接 return，没有调用 setState", "ok");
				return;
			}

			setPhase("returned");
			setResultCount(count);
			if (guarded) {
				addLog("await 恢复 → cancelled 仍是 false，正常放行");
				addLog(`setProjects(...) 拿到 ${count} 个项目`, "ok");
			} else {
				addLog("await 恢复 → 没有任何关卡，直接往下执行");
				addLog("setProjects(...) ⚠️ 对已卸载的组件执行了 setState", "warn");
				addLog("React 警告：无法对已卸载的组件执行状态更新", "warn");
			}
		});
	}, [addLog, clearTimer, delay]);

	/** 模拟组件卸载：触发 effect cleanup */
	const handleUnmount = useCallback(() => {
		if (phase !== "requesting") return;
		setPhase("unmounted");

		if (modeRef.current === "guarded") {
			cancelledRef.current = true;
			setCancelled(true);
			addLog("cleanup 执行 → cancelled = true");
			addLog("组件已卸载，但请求仍在飞…");
		} else {
			addLog("cleanup 执行 → 没有 cleanup，什么都没做");
			addLog("组件已卸载，但请求仍在飞…");
		}
	}, [addLog, phase]);

	const isRequesting = phase === "requesting";
	const activeIndex = PHASES.findIndex((p) => p.key === phase);

	return (
		<div className="min-h-screen bg-slate-50 text-slate-800">
			<div className="mx-auto max-w-5xl px-6 py-8 space-y-6">
				{/* 头部 */}
				<header className="flex items-start justify-between gap-4">
					<div>
						<p className="text-sm text-slate-400 mb-1">交互式原理演示</p>
						<h1 className="text-2xl font-bold text-slate-900">
							<code className="text-brand-600">cancelled</code> 到底是干什么的
						</h1>
						<p className="mt-2 text-sm text-slate-500 max-w-2xl">
							用项目里真实的 <code>listPages</code> 接口演一遍。核心就一句话：
							<strong>请求发出后，组件可能在你收到响应之前就卸载了</strong>，
							这时候要用一个标志位告诉「迟到的响应」—— 这轮已经作废，别碰组件状态。
						</p>
					</div>
					<button
						className="vc-btn-ghost flex-shrink-0"
						onClick={() => navigate(-1)}
						type="button"
					>
						<ArrowLeft className="h-4 w-4" /> 返回
					</button>
				</header>

				{/* 模式切换 */}
				<div className="vc-card p-4 flex flex-wrap items-center gap-3">
					<span className="text-sm font-medium text-slate-600">演示模式：</span>
					<button
						type="button"
						className={mode === "guarded" ? "vc-btn" : "vc-btn-ghost"}
						onClick={() => setMode("guarded")}
					>
						有 cancelled 防护
					</button>
					<button
						type="button"
						className={mode === "unguarded" ? "vc-btn" : "vc-btn-ghost"}
						onClick={() => setMode("unguarded")}
					>
						没有 cancelled
					</button>
					<div className="ml-auto flex items-center gap-3">
						<label className="flex items-center gap-2 text-sm text-slate-600">
							<Timer className="h-4 w-4 text-slate-400" />
							请求耗时
							<input
								type="range"
								min={1000}
								max={8000}
								step={500}
								value={delay}
								onChange={(e) => setDelay(Number(e.target.value))}
								className="w-32 accent-brand-500"
							/>
							<code className="w-14 text-right">{(delay / 1000).toFixed(1)}s</code>
						</label>
					</div>
				</div>

				{/* 阶段流程条 */}
				<div className="vc-card p-5">
					<div className="flex items-center gap-2 flex-wrap">
						{PHASES.map((p, i) => {
							const active = i === activeIndex;
							const passed = i < activeIndex;
							return (
								<div key={p.key} className="flex items-center gap-2">
									<div
										className={[
											"flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all",
											active
												? "bg-brand-50 text-brand-700 font-semibold ring-1 ring-brand-200"
												: passed
													? "text-slate-400"
													: "text-slate-300",
										].join(" ")}
									>
										<span
											className={[
												"h-2 w-2 rounded-full",
												active
													? "bg-brand-500"
													: passed
														? "bg-slate-300"
														: "bg-slate-200",
											].join(" ")}
										/>
										{p.label}
									</div>
									{i < PHASES.length - 1 && (
										<span className="text-slate-300 select-none">→</span>
									)}
								</div>
							);
						})}
					</div>

					{/* 操作区 */}
					<div className="mt-5 flex flex-wrap items-center gap-3">
						<button
							type="button"
							className="vc-btn"
							onClick={handleMount}
							disabled={isRequesting}
						>
							<Play className="h-4 w-4" />
							{phase === "idle" ? "挂载组件（发请求）" : "重新挂载"}
						</button>
						<button
							type="button"
							className="vc-btn-ghost"
							onClick={handleUnmount}
							disabled={!isRequesting}
						>
							<Square className="h-4 w-4" /> 卸载组件
						</button>
						<button type="button" className="vc-btn-ghost" onClick={reset}>
							<RotateCcw className="h-4 w-4" /> 重置
						</button>

						<div className="ml-auto flex items-center gap-4 text-sm">
							<span className="text-slate-500">
								cancelled ={" "}
								<code
									className={
										cancelled
											? "font-semibold text-red-600"
											: "font-semibold text-brand-600"
									}
								>
									{String(cancelled)}
								</code>
							</span>
							{resultCount !== null && (
								<span className="text-emerald-600 font-medium">
									已渲染 {resultCount} 个项目
								</span>
							)}
						</div>
					</div>

					{!isRequesting && phase === "idle" && (
						<p className="mt-4 text-xs text-slate-400">
							提示：点「挂载组件」后，在请求返回前点「卸载组件」，再观察请求回来时会发生什么。
						</p>
					)}
				</div>

				{/* 代码 + 日志 */}
				<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
					{/* 代码 */}
					<div className="vc-card p-5">
						<h2 className="text-sm font-semibold text-slate-700 mb-3">
							{mode === "guarded" ? "ProjectList.tsx 的写法" : "去掉防护后的写法"}
						</h2>
						<pre className="overflow-x-auto rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-slate-100">
							<code>
								{(mode === "guarded" ? GUARDED_CODE : UNGUARDED_CODE).map(
									(line, i) => {
										const highlight =
											(mode === "guarded" &&
												(i === 1 || i === 4 || i === 8)) ||
											(mode === "unguarded" && i === 4);
										return (
											<div
												key={i}
												className={
													highlight
														? "rounded bg-amber-400/20 px-1 -mx-1 text-amber-200"
														: undefined
												}
											>
												{line || " "}
											</div>
										);
									}
								)}
							</code>
						</pre>
						<p className="mt-3 text-xs text-slate-500 leading-relaxed">
							{mode === "guarded" ? (
								<>
									高亮三行是关键：<code>let cancelled = false</code> 每次 effect
									执行都新建一个；<code>if (cancelled) return</code> 是 await
									恢复后的关卡；<code>cancelled = true</code> 在 cleanup
									里把便签改成「作废」。
								</>
							) : (
								<>
									没有 cleanup，请求回来后无从判断组件是否还在，只能硬着头皮
									setState。
								</>
							)}
						</p>
					</div>

					{/* 日志 */}
					<div className="vc-card p-5">
						<h2 className="text-sm font-semibold text-slate-700 mb-3">执行日志</h2>
						<div className="h-72 overflow-y-auto rounded-lg bg-slate-900 p-4 font-mono text-xs leading-relaxed">
							{logs.length === 0 ? (
								<div className="text-slate-500">
									（还没有事件，先点「挂载组件」）
								</div>
							) : (
								logs.map((line) => (
									<div key={line.id} className="flex gap-3">
										<span className="flex-shrink-0 text-slate-500">
											{line.time}
										</span>
										<span
											className={
												line.kind === "warn"
													? "text-red-300"
													: line.kind === "ok"
														? "text-emerald-300"
														: "text-slate-200"
											}
										>
											{line.text}
										</span>
									</div>
								))
							)}
						</div>
					</div>
				</div>

				{/* 小结 */}
				<div className="vc-card p-5 space-y-3">
					<h2 className="text-sm font-semibold text-slate-700">三句话总结</h2>
					<ol className="space-y-2 text-sm text-slate-600 leading-relaxed list-decimal list-inside">
						<li>
							<code>cancelled</code> 是 effect 闭包里的一个普通布尔变量，
							<strong>不属于组件 state</strong>，所以 React DevTools 里看不到它。
						</li>
						<li>
							effect 每次执行都会新建一个 <code>cancelled</code>，
							旧的那份留给旧请求用 —— 这就是它能区分「哪一轮请求」的原因。
						</li>
						<li>
							它只能<strong>丢弃迟到的结果</strong>，不能取消已经发出去的 HTTP 请求。
							真要中断请求得用 <code>AbortController</code>。
						</li>
					</ol>
				</div>
			</div>
		</div>
	);
}
