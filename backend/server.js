const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const cron = require('node-cron');
const driver = require('./driver');

require('dotenv').config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = process.env.ATLAS_URI;
mongoose.connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true });
const connection = mongoose.connection;
connection.once('open', () => {
  console.log("MongoDB database connection established successfully");
})

const stockRouter = require('./routes/stock');
const userRouter = require('./routes/user');

app.use('/api/stock', stockRouter);
app.use('/api/user', userRouter);

// call driver.js / check stock data every minute
cron.schedule('* * * * *', () => {
  function dateFormat(toFormat) {
    return ("0" + toFormat).slice(-2);
  }
  let now = new Date();
  let datetime = dateFormat(now.getMonth()+1) + "/"
                + dateFormat(now.getDate())  + "/" 
                + now.getFullYear() + " "  
                + dateFormat(now.getHours()) + ":"  
                + dateFormat(now.getMinutes()) + ":" 
                + dateFormat(now.getSeconds());
  console.log(`\x1b[1m\x1b[36m${datetime}\x1b[0m ****************************************************`); // current time header for each script run
  driver.main();
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});