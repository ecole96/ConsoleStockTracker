// endpoints for interacting with console stock data

const router = require('express').Router();
let Stock = require('../models/Stock.model');
let LastRun = require('../models/LastRun.model');

router.route('/pull_data').get((req, res) => {
  let deliverable = {}; // final returned JSON (if successful) contains LastRun timestamp and all Stock data
  Stock.find({}, {_id: 0}).sort({"console":1}).exec() // get stock data
  .then(stock => {
    deliverable['stock'] = stock;
    return LastRun.findOne({},{_id: 0}).exec(); // get timestamp of last data update (only document should exist in entire collection)
  })
  .then(lastrun => {
    deliverable['last_runtime'] = lastrun['last_runtime'];
    res.json(deliverable);
  })
  .catch(err => res.status(400).json('Error: ' + err));
});

module.exports = router;