const mongoose = require('mongoose');

const Question = new mongoose.Schema(
	{
		_id: { type: mongoose.Schema.Types.ObjectId },
		quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
		question: { type: String, required: true },
		answers: { type: Array, required: true },
		correctAnswers: {
			type: [{ type: String }],
			requird: true,
		},
		comment: { type: String },
		updatedAt: { type: Date },
		sortOrder: { type: Number },
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

module.exports = mongoose.model('Question', Question);
