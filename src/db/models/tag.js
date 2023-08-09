const mongoose = require('mongoose');

const Tag = new mongoose.Schema(
	{
		name: { type: String, required: true, unique: true },
		type: { type: String },
		createdAt: { type: Date, default: Date.now },
		updatedAt: { type: Date },
	},
	{
		toJSON: {
			transform: (_doc, ret) => {
				ret.id = ret._id;
				delete ret._id;
				delete ret.__v;
			},
		},
	}
);

module.exports = mongoose.model('Tag', Tag);
