const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const LastRunSchema = new Schema({ // keeps track of the last time stock data was updated (this collection is only intended to have a single document)
    last_runtime: {
        type: Date,
        default: Date.now
    }
  }, {versionKey: false, _id: false});

const LastRun = mongoose.model('LastRun', LastRunSchema);

module.exports = LastRun;