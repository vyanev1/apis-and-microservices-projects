const mongoose = require('mongoose')
const Schema = mongoose.Schema

var Exercises = new Schema({
  userId: { type: String, required: true, ref: 'Users', index: true },
  username: { type: String },
  description: { type: String, required: true, maxlength: [20, 'Description too long'] },
  duration: { type: Number, required: true, min: [1, 'Duration too short'] },
  date: { type: Date, required: false, default: Date.now }
});

// validate userId, and add "username" to the exercise instance
Exercises.pre('save', function(next) {
  mongoose.model('Users').findById(this.userId, (err, user) => {
    if(err) return next(err)
    if(!user) {
      const err = new Error('unknown userId')
      err.status = 400
      return next(err);
    }
    this.username = user.username
    if(!this.date) {
      this.date = Date.now();
    }
    next();
  });
});

module.exports = mongoose.model('Exercises', Exercises);