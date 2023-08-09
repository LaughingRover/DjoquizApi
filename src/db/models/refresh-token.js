const mongoose = require('mongoose');

const RefreshToken = new mongoose.Schema({
    value: { type: String, required: true, unique: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    isRevoked: Boolean,
    createdAt: Number,
    expiresAt: Number
}, {
    "toJSON": {
        transform: (_doc, ret) => {
            ret.id = ret._id;
            delete ret._id;
            delete ret.__v;
        }
    }
});

module.exports = mongoose.model('RefreshToken', RefreshToken);