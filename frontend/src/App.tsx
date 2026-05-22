import { Suspense, useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { ConfigProvider } from "antd";
import { router, routerFallbackElement } from "./router";

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
			<ConfigProvider
				theme={{
					token: {
						colorPrimary: "#6366f1",
						colorBgBase: "#ffffff",
						colorBgContainer: "#ffffff",
						colorBgElevated: "#ffffff",
						colorBgLayout: "#f8fafc",
						colorTextBase: "#1e293b",
						colorText: "#1e293b",
						colorTextSecondary: "#64748b",
						colorTextTertiary: "#94a3b8",
						colorBorder: "#e2e8f0",
						colorBorderSecondary: "#f1f5f9",
						colorFill: "rgba(99,102,241,0.06)",
						colorFillSecondary: "#f8fafc",
						borderRadius: 8,
						controlHeight: 38,
						wireframe: false,
					},
					components: {
						Button: {
							controlHeight: 40,
							controlHeightLG: 44,
							colorPrimary: "#6366f1",
							colorPrimaryHover: "#818cf8",
							colorPrimaryActive: "#4f46e5",
							borderRadiusLG: 10,
							primaryShadow: "0 4px 14px rgba(99,102,241,0.18)",
						},
						Input: {
							controlHeight: 40,
							colorBgContainer: "#fff",
							colorBorder: "#e2e8f0",
							colorTextPlaceholder: "#94a3b8",
							activeShadow: "0 0 0 2px rgba(99,102,241,0.12)",
							hoverBorderColor: "#a5b4fc",
						},
						Tabs: {
							inkBarColor: "#6366f1",
							itemColor: "#64748b",
							itemSelectedColor: "#1e293b",
							itemHoverColor: "#4f46e5",
						},
						Form: {
							labelColor: "#475569",
						},
						Message: {
							colorText: "#1e293b",
						},
						Menu: {
							colorBgContainer: "#fff",
							colorText: "#475569",
							itemSelectedBg: "#eef2ff",
							itemSelectedColor: "#4f46e5",
							itemHoverBg: "#f8fafc",
							itemHoverColor: "#1e293b",
							subMenuItemBg: "#fff",
						},
						Modal: {
							contentBg: "#fff",
							headerBg: "#fff",
							titleColor: "#1e293b",
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
