const mongoose = require('mongoose');

const Schema = mongoose.Schema;

var prefsSchema = new Schema({
  series_x: {
    type: Boolean,
    default: true,
  },
  series_s: {
    type: Boolean,
    default: true,
  },
  ps5: {
    type: Boolean,
    default: true,
  },
  ps5d: {
    type: Boolean,
    default: true,
  }
}, {_id: false});

const UserSchema = new Schema({
  email: { // for mailing list
          type: String, 
          required: [true,"Email is required."],
          lowercase: true,
          unique: true,
          minlength: [3, "Email must be a minimum length of 3 characters."],
          maxlength: [254, "Email must not exceed 254 characters."]
  },
  prefs: { // user will receive in-stock updates for whichever consoles the user selects (both true by default)
    type: prefsSchema,
    validate: { // at least one of the consoles should be chosen for updates (no updates = no point in signing up)
      validator: function (value) {
        return value.series_x || value.series_s || value.ps5 || value.ps5d;
      },
      message: 'At least one console must be selected.'
    }
  }
}, { timestamps: true });

// Validating emails
UserSchema.path('email').validate(async (email) => {
  const emailCount = await mongoose.models.User.countDocuments({ email }); // get number of documents with the email to be registered (should be zero)
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // email formatting regex
  if(emailCount != 0) { // check if email already exists in database
    throw new Error('Email already exists.');
  }
  else if (!re.test(email)) { // check if email is formatted correctly
    throw new Error('Email is invalid.');
  }
  return true;
}, 'Email is invalid.');

const User = mongoose.model('User', UserSchema);

module.exports = User;