const mongoose = require('mongoose');

const millerDemandSchema = new mongoose.Schema({
    millerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Miller',
        required: true
    },

    paddyType: {
        type: String,
        required: true
    },

    quantityNeeded: {
        type: Number,
        required: true
    },

    offeredPrice: {
        type: Number,
        required: true
    },

    status: {
        type: String,
        default: 'open'
    }

}, { timestamps: true });

module.exports = mongoose.model('MillerDemand', millerDemandSchema);