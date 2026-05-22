import {
	Navigate,
	Outlet,
	createBrowserRouter,
	isRouteErrorResponse,
	useLocation,
	useRouteError,
} from "react-router-dom";
import { Suspense, lazy, useEffect, useRef } from "react";
import { Button, Result, Spin, message } from "antd";

// 延迟加载页面级组件，减小首屏包体
const Home = lazy(() => import("../components/index/Home"));
const Editor = lazy(() => import("../components/editor/Index"));
const Auth = lazy(() => import("../components/login/AuthPage"));
const Projects = lazy(() => import("../components/projects/ProjectList"));
const Preview = lazy(() => import("../components/preview/PreviewPage"));

// 路由懒加载的统一兜底，让首屏不再空白
const RouteFallback = () => (
	<div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-950 text-slate-200">
		<Spin size="large" />
		<div>页面加载中，请稍候…</div>
	</div>
);

// 捕获路由异常，避免白屏并给出可操作入口
const RouteErrorBoundary = () => {
	const error = useRouteError();
	const is404 = isRouteErrorResponse(error) && error.status === 404;
	return (
		<Result
			status={is404 ? "404" : "500"}
			title={is404 ? "页面不存在" : "页面出错了"}
			subTitle="请重试或返回首页"
			extra={
				<Button type="primary" onClick={() => (window.location.href = "/")}>
					返回首页
				</Button>
			}
		/>
	);
};

// 受保护区域的通用守卫：无 token 时提醒并拉回登录
const AuthGuard = () => {
	const location = useLocation();
	const hasToken = Boolean(localStorage.getItem("token"));
	const warnedRef = useRef(false);

	useEffect(() => {
		if (!hasToken && !warnedRef.current) {
			warnedRef.current = true;
			message.warning("请先登录后访问该页面");
		}
	}, [hasToken]);

	if (!hasToken) {
		return <Navigate to="/auth" replace state={{ from: location }} />;
	}

	return <Outlet />;
};

// 根容器，负责为所有懒加载页面提供 Suspense 兜底
const RouteContainer = () => (
	<Suspense fallback={<RouteFallback />}>
		<Outlet />
	</Suspense>
);

export const routerFallbackElement = <RouteFallback />;

export const router = createBrowserRouter([
	{
		element: <RouteContainer />,
		errorElement: <RouteErrorBoundary />,
		children: [
			{
				path: "/",
				Component: Home,
			},
			{
				path: "/auth",
				Component: Auth,
			},
			{
				element: <AuthGuard />,
				children: [
					{
						path: "/projects",
						Component: Projects,
					},
					{
						path: "/editor/:id",
						Component: Editor,
					},
					{
						path: "/preview/:id",
						Component: Preview,
					},
				],
			},
		],
	},
]);
