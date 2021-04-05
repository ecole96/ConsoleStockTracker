const mongoose = require('mongoose');

const Schema = mongoose.Schema;

var storeSchema = new Schema({
    store: {
        type: String,
        minlength: 1
    },
    in_stock: { // current stock state for console (at store)
        type: Boolean,
        default: false
    },
    last_time_in_stock: {
        type: Date, // last time console was in stock (at store)
        default: undefined
    },
    url: {
        type: String,
        default: undefined
    }
}, {_id: false});

const StockSchema = new Schema({ // the stock status of a console at various stores
    console: {
        type: String,
        required: true,
        unique: true,
        minlength: 1
    },
    stores: {
        type: [storeSchema],
        default: []
    }
  }, {versionKey: false});

const Stock = mongoose.model('Stock', StockSchema);

module.exports = Stock;