import { Schema, model, type Document, type Types } from "mongoose";

interface Userproperty {
	email: string;
	passwordHash: string;
	name?: string;
	createdAt: Date;
}

interface UserMethods {
	toSafeJSON(): {
		id: Types.ObjectId;
		email: string;
		name?: string;
		createdAt: Date;
	};
}

export interface IUser extends Document, Userproperty, UserMethods {
	_id: Types.ObjectId;
}
//Schema:一个user必须有哪些字段字段类型和规则：
const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true, //非空
			unique: true, //声明为这个字段建立唯一索引，防止重复邮箱
			lowercase: true, //转为小写
			trim: true, //去掉字符串首尾空白
		},
		passwordHash: {
			type: String,
			required: true,
		},
		name: {
			type: String,
			trim: true,
		},
		createdAt: {
			//创建时间
			type: Date,
			default: Date.now,
		},
	},
	{
		collection: "users",
	}
);
// 它们最终都表示“字符串”，但一个给 TypeScript 看，一个给 Mongoose 在程序运行时看。
//实例的方法 一般来说只能这么加
UserSchema.methods.toSafeJSON = function (this: IUser) {
	return {
		id: this._id,
		email: this.email,
		name: this.name,
		createdAt: this.createdAt,
	};
};

const User = model<IUser>("User", UserSchema);
export default User;
// Schema 第一个对象：描述数据库字段
// Schema.methods：注册文档实例方法
// interface：给 TypeScript 做类型检查
// model：根据 Schema 生成数据库操作工具
//model第一个参数 是创建的集合名字

// MongoDB
//   ↓ 查询结果
// Express 后端得到 user（包含 passwordHash）
//   ↓ 后端调用 user.toSafeJSON()
// 后端得到一个新对象（只有 id、email）
//   ↓ 后端调用 res.json(...) 发送响应
// 浏览器收到用户信息
