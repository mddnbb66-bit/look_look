import { Schema, model, type Document, type Types } from "mongoose";

export interface IUser extends Document {
	_id: Types.ObjectId;
	email: string;
	passwordHash: string;
	name?: string;
	createdAt: Date;
	toSafeJSON(): { id: Types.ObjectId; email: string; name?: string; createdAt: Date };
}

const UserSchema = new Schema<IUser>(
	{
		email: {
			type: String,
			required: true,
			unique: true,
			lowercase: true,
			trim: true,
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
			type: Date,
			default: Date.now,
		},
	},
	{
		collection: "users",
	}
);

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
