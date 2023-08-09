const mongoose = require('mongoose');

function setUpdateTime(next) {
	// if (this._update['$set']) this._update['$set'].updatedAt = new Date().toISOString();
	this.set('updatedAt', new Date().toISOString());
	next();
}

const Round = new mongoose.Schema(
	{
		quizId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
		playerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
		questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true }],
        answered: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
		score: { type: Number },
		totalTime: { type: Number },
		updatedAt: { type: Date, default: Date.now },
		createdAt: { type: Date },
		hasEnded: { type: Boolean },
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

Round.pre('update', setUpdateTime);
Round.pre('updateOne', setUpdateTime);

module.exports = mongoose.model('Round', Round);
