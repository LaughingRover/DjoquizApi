const mongoose = require('mongoose');

var Quiz = new mongoose.Schema(
	{
		title: {
			type: String,
		},
		status: {
			type: String,
			required: true,
			enum: { values: ['draft', 'published'], message: '{VALUE} is not supported' },
		},
		references: {
			type: Array,
		},
		image: {
			type: String,
		},
		ownerId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		tagsId: {
			type: [{ type: mongoose.Schema.Types.ObjectId }],
			ref: 'Tag',
		},
		createdAt: {
			type: Date,
		},
		updatedAt: {
			type: Date,
			required: true,
			default: Date.now,
		},
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

module.exports = mongoose.model('Quiz', Quiz);
