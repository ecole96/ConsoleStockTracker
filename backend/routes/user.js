// endpoints for interacting with mailing list

const router = require('express').Router();
let User = require('../models/User.model');

// mailing list signup
router.route('/new').post((req, res) => {
  const email = req.body.email;
  const series_x = req.body.series_x;
  const series_s = req.body.series_s;
  const ps5 = req.body.ps5;
  const ps5d = req.body.ps5d;

  const newUser = new User({email: email, prefs: {series_x:series_x, series_s:series_s, ps5:ps5, ps5d:ps5d}});
  newUser.save()
    .then(() => res.json(`${email} has been added to the mailing list.`))
    .catch(err => {
      const firstErrorMsg = Object.values(err.errors)[0].message; // get first error message that occurs (there's usually one anyways)
      /* email already exists in database = status code 409
        client-side validation should have already handled and displayed errors for every other kind of error here
        so, differentiating this error from the rest in order to easily display error in email field on form in webapp */
      const status = (firstErrorMsg == 'Email already exists.') ? 409 : 400; 
      res.status(status).json(err.message);
    });
});

// update user mailing list preferences
router.route('/update/:email').post(async (req, res) => {
  try {
    const email = req.params.email;
    const user = await User.findOne({email: email}).exec();
    if(!user) {
      res.status(404).json(`${email} is not on the mailing list.`); // no user to update = status code 404
    }
    else {
      const series_x = req.body.series_x;
      const series_s = req.body.series_s;
      const ps5 = req.body.ps5;
      const ps5d = req.body.ps5d;
      await User.updateOne({_id:user._id},{prefs:{series_x:series_x, series_s:series_s, ps5:ps5, ps5d:ps5d}});
      res.json(`${email}'s preferences have been updated.`);
    }
  }
  catch(err) {
    res.status(400).json(err.message);
  }
})

// remove user from mailing list
router.route('/delete/:email').delete(async (req, res) => {
    try {
      const email = req.params.email;
      const user = await User.findOne({email: email}).exec();
      if(!user) {
        res.status(404).json(`${email} is not on the mailing list.`); // no user to delete = status code 404
      }
      else {
        await User.deleteOne({_id:user._id});
        res.json(`${email} has been removed from the mailing list.`);
      }
    }
    catch(err) {
      res.status(400).json(err.message);
    }
});

module.exports = router;