import { http } from "./request";

export const login = (email: string, password: string): any => {
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
