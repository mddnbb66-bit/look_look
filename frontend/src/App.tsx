import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";

import { router, routerFallbackElement } from "./router";

// 和 index.css 的 --vc-ink / --vc-accent 是同一组值。
// AntD 的主题只能接收具体的颜色字符串，读不了 CSS 变量，所以这里再写一份。
const INK = "#0f172a"; // 最深的中性色（slate-900）
const ACCENT = "#3b76f6"; // 强调色（brand-500）

function App() {
	useEffect(() => {
		const observer = new PerformanceObserver((list) => {
			const entries = list.getEntries();
			console.log(entries);
		});

		observer.observe({ type: "paint", buffered: true });

		return () => {
			observer.disconnect();
		};
	}, []);
			
	return (
		<>
			{/*
				AntD 主题：让 AntD 组件和我们自己写的 Tailwind 界面用同一套颜色。
				- token：全局变量，所有 AntD 组件都会读
				- components：只对某一种组件生效的变量
				颜色值都来自文件顶部的 INK / ACCENT 和 Tailwind 的 slate 色阶。
			*/}
			<ConfigProvider
				theme={{
					token: {
						// 主色用最深的中性色：主按钮、开关、选中的单选按钮都会变成深色
						colorPrimary: INK,
						// 链接、信息提示用强调色
						colorLink: ACCENT,
						colorInfo: ACCENT,
						colorBgBase: "#ffffff",
						colorBgContainer: "#ffffff",
						colorBgElevated: "#ffffff",
						colorBgLayout: "#f8fafc",
						colorTextBase: INK,
						colorText: INK,
						colorTextSecondary: "#475569", // slate-600
						colorTextTertiary: "#64748b", // slate-500
						colorBorder: "#e2e8f0", // slate-200
						colorBorderSecondary: "#f1f5f9", // slate-100
						colorFill: "rgba(15,23,42,0.06)",
						colorFillSecondary: "#f8fafc",
						borderRadius: 6,
						// 控件默认高 32px；属性面板里用 size="small"，会是 24px
						controlHeight: 32,
						wireframe: false,
					},
					components: {
						Button: {
							colorPrimaryHover: "#1e293b", // slate-800
							colorPrimaryActive: "#020617", // slate-950
							// 去掉主按钮自带的彩色投影
							primaryShadow: "none",
							defaultShadow: "none",
						},
						Input: {
							colorTextPlaceholder: "#94a3b8",
							// 聚焦时：边框变深 + 一圈很淡的强调色
							hoverBorderColor: "#cbd5e1",
							activeBorderColor: INK,
							activeShadow: "0 0 0 2px rgba(59,118,246,0.16)",
						},
						InputNumber: {
							hoverBorderColor: "#cbd5e1",
							activeBorderColor: INK,
							activeShadow: "0 0 0 2px rgba(59,118,246,0.16)",
						},
						Select: {
							hoverBorderColor: "#cbd5e1",
							activeBorderColor: INK,
							activeOutlineColor: "rgba(59,118,246,0.16)",
							optionSelectedBg: "#f1f5f9",
						},
						Tabs: {
							inkBarColor: INK,
							itemColor: "#64748b",
							itemSelectedColor: INK,
							itemHoverColor: INK,
						},
						Form: {
							labelColor: "#475569",
						},
						Message: {
							colorText: INK,
						},
						Collapse: {
							// 属性面板的分组标题不要灰色底
							headerBg: "transparent",
						},
						Modal: {
							contentBg: "#fff",
							headerBg: "#fff",
							titleColor: INK,
						},
					},
				}}
			>
				<Suspense fallback={routerFallbackElement}>
					<RouterProvider router={router} />
				</Suspense>
			</ConfigProvider>
		</>
	);
}

export default App;
