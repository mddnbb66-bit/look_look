import mongoose, { type Types } from "mongoose";

export interface IPage {
	_id: Types.ObjectId;
	name: string;
	title: string;
	description: string;
	thumbnailUrl: string;
	schema: Record<string, any>;
	owner: Types.ObjectId;
	createdAt: Date;
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

const PageSchema = new mongoose.Schema<IPage>(
	{
		name: { type: String, default: "" },
		title: { type: String, default: "" },
		description: { type: String, default: "" },
		thumbnailUrl: { type: String, default: "" },
		schema: { type: Object, required: true },
		owner: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "User",
			required: true,
			index: true,
		},
	},
	{
		timestamps: true,
	}
);

PageSchema.methods.toSafeJSON = function (this: IPage) {
	return {
		pageId: this._id.toString(),
		name: this.name,
		title: this.title,
		description: this.description,
		thumbnailUrl: this.thumbnailUrl,
		schema: this.schema,
		createdAt: this.createdAt,
		updatedAt: this.updatedAt,
	};
};

const Page = mongoose.model<IPage>("Page", PageSchema);

export default Page;
