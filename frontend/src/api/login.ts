import { http } from "./request";

export const login = (email: string, password: string): any => {
	//发送给后端。然后用前端res接受结果
	return http.post("/auth/login", {
		email,
		password,
	});
};

export const register = (email: string, password: string): any => {
	return http.post("/auth/register", {
		email,
		password,
	});
};
