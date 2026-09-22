// vision-craft 数据库
//   ├── users 集合
//   │     └── 一个个用户文档
//   └── pages 集合
//         └── 一个个项目页面文档

import { Schema, type Types, model } from "mongoose";
export interface IPage {
	_id: Types.ObjectId;
	name: string;
	title: string;
	description: string;
	thumbnailUrl: string; //缩略图地址
	schema: Record<string, any>; //core :这是一个对象，它的 key 是 string，value 可以是任意类型
	owner: Types.ObjectId; //user的id  这是个id
	createdAt: Date; //创建和更新日期，
	updatedAt: Date;
	toSafeJSON(): {
		pageId: string;
		name: string;
		title: string;
		description: string;
		thumbnailUrl: string;
		schema: Record<string, any>;
		createdAt: Date;
		updatedAt: Date;
	};
}

const PageSchema = new Schema<IPage>(
	{
		name: { type: String, default: "" },
		title: { type: String, default: "" },
		description: { type: String, default: "" },
		thumbnailUrl: { type: String, default: "" },
		schema: { type: Object, required: true },
		owner: {
			type: Schema.Types.ObjectId, //User 的 _id。
			ref: "User", //这是关联了
			required: true,
			index: true,
		},
	},
	{
		timestamps: true, //自动加字段更新日期和创建时间的日期
	}
);
// 所以这个方法的意图就是：

// 不把数据库文档原封不动返回给前端，而是自己挑选允许暴露的字段。
PageSchema.methods.toSafeJSON = function (this: IPage) {
	return {
		pageId: this._id.toString(), //暴露出去的是页面id
		name: this.name,
		title: this.title,
		description: this.description,
		thumbnailUrl: this.thumbnailUrl,
		schema: this.schema,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
	};
};

const Page = model<IPage>("Page", PageSchema);

export default Page;
// index: true,
//添加数据库索引，也就是，
// User A 的 ObjectId
// → Page 1 在哪
// → Page 2 在哪
// → Page 3 在哪

// User B 的 ObjectId
// → Page 4 在哪
// → Page 5 在哪
// → Page 6 在哪
