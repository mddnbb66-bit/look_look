import { useState } from "react";
import { Tabs, Form, Input, Button, message } from "antd";
import { login, register } from "../../api/login";
//保存凭证和跳转之用
import { useNavigate } from "react-router-dom";
//本文登陆之页。还包含登陆注册逻辑
export default function AuthPage() {
	const [mode, setMode] = useState<"login" | "register">("login");
	// loading的作用
	// 让用户知道程序正在等待，并没有卡死。
    // 等待期间禁用按钮，避免重复发送请求。
	const [loading, setLoading] = useState(false);

	const [form] = Form.useForm();
	const navigate = useNavigate();

	const handleSubmit = async (values: any) => {
		setLoading(true);
		//把来的账密进行解构
		const { email, password } = values;
		try {
			if (mode === "login") {
				const res = await login(email, password);
				if (res.code === 0) {
					// 请求成功或可能报错
					//走登陆逻辑
					message.success(res.message);
					localStorage.setItem("token", res.data.token);
					localStorage.setItem("user", JSON.stringify(res.data.user));
					localStorage.setItem("userId", res.data.user.id);
					navigate("/projects");
				} else {
					// res.message后端返回的提示文字，例如“登录成功/失败”
					
					message.error(res.message);
				}
			} else {
				//注册逻辑
				// 请求成功或可能报错
				const res = await register(email, password);
				if (res.code === 0) {
					message.success(res.message);
					setMode("login");
					form.resetFields();
				} else {
					message.error(res.message);
				}
			}
		} catch (error) {
			console.error(error);
			message.error("请求失败，请稍后重试");
		} finally {
			// 不管结果如何，请求结束了
			// 所以“正在等待”这个状态应该结束。
			setLoading(false);
		}
	};

	const onModeChange = (next: "login" | "register") => {
		setMode(next);
		form.resetFields();
	};

	// 页面结构：整屏居中一个窄列（max-w-sm），从上到下是 标识 → 标题 → 表单卡片。
	// 原来左边那一大块宣传文案和三个徽标去掉了：登录页只做登录这一件事。
	return (
		// body 设了 overflow: hidden，所以这一层自己滚动（小屏幕、注册表单较高时用得到）
		<div className="h-screen overflow-y-auto bg-slate-50 text-slate-900">
			{/* min-h-full + flex 居中：内容矮时垂直居中，内容高时从顶部正常排，不会被裁掉 */}
			<div className="flex min-h-full items-center justify-center px-4 py-10">
				<div className="w-full max-w-sm animate-fade-in">
					{/* 标识：点击回首页 */}
					<a href="/" className="flex items-center gap-2.5">
						<div className="flex h-7 w-7 items-center justify-center rounded-md bg-slate-900 text-[10px] font-bold tracking-wide text-white">
							VC
						</div>
						<span className="text-[15px] font-semibold">Vision-Craft</span>
					</a>

					<h1 className="mt-8 text-2xl font-semibold tracking-tight">
						{mode === "login" ? "登录" : "注册账号"}
					</h1>
					<p className="mt-2 text-sm text-slate-500">
						{mode === "login"
							? "登录后继续编辑你的数据大屏。"
							: "注册完成后，用邮箱和密码登录。"}
					</p>

					{/* 表单卡片 */}
					<div className="vc-card mt-6 p-6">
						<Tabs
							activeKey={mode}
							onChange={(key) => onModeChange(key as "login" | "register")}
							items={[
								{ key: "login", label: "登录" },
								{ key: "register", label: "注册" },
							]}
							className="mb-4"
						/>

						<Form
							form={form}
							layout="vertical"
							requiredMark={false}
							onFinish={handleSubmit}
						>
							{/* 表单项之间的间距用 AntD 自带的 24px。
							    原来这里有个 space-y-1，它会把后面几项的下边距清零，导致密码框和按钮贴在一起 */}
							<Form.Item
								label={<span className="text-slate-600 text-sm">邮箱</span>}
								name="email"
								rules={[
									{ required: true, message: "邮箱不能为空" },
									{ type: "email", message: "请输入有效邮箱" },
								]}
							>
								<Input size="large" placeholder="you@example.com" />
							</Form.Item>

							<Form.Item
								label={<span className="text-slate-600 text-sm">密码</span>}
								name="password"
								rules={[{ required: true, message: "密码不能为空" }]}
							>
								<Input.Password size="large" placeholder="请输入密码" />
							</Form.Item>

							{mode === "register" && (
								<Form.Item
									label={<span className="text-slate-600 text-sm">确认密码</span>}
									name="confirm"
									dependencies={["password"]}
									rules={[
										{ required: true, message: "请再次输入密码" },
										({ getFieldValue }) => ({
											validator(_, value) {
												if (!value || getFieldValue("password") === value) {
													return Promise.resolve();
												}
												return Promise.reject(
													new Error("两次输入的密码不一致")
												);
											},
										}),
									]}
								>
									<Input.Password size="large" placeholder="请再次输入密码" />
								</Form.Item>
							)}

							{/* !mb-4：按钮下面只留 16px（默认 24px），让底部那行小字离按钮近一点 */}
							<Form.Item className="!mb-4">
								<Button
									type="primary"
									htmlType="submit"
									loading={loading}
									block
									size="large"
									className="!font-medium"
								>
									{mode === "login" ? "登录" : "注册"}
								</Button>
							</Form.Item>

							<div className="text-xs text-slate-500 text-center">
								点击按钮即表示同意《隐私政策》与《用户协议》
							</div>
						</Form>
					</div>
				</div>
			</div>
		</div>
	);
}
