const Users = require('../models/users');
const Exercises = require('../models/exercises');

const router = require('express').Router();


// POST Requests
router.post('/new-user', (req, res, next) => {
  if (req.body.username) {
    const user = new Users({ username: req.body.username });
    user.save((err, createdUser) => {
      if(err) {
        if(err.code == 11000) {
          // uniqueness error (no custom message)
          return next({
            status: 400,
            message: 'Username already taken'
          });
        } else {
          return next(err)
        }
      }
      res.send({username: createdUser.username, _id: createdUser._id});
    });
  }
  else {
    return next({
      status: 400,
      message: 'Username field cannot be empty'
    });
  }
});


router.post('/add', (req, res, next) => {
  Users.findById(req.body.userId, (err, user) => {
    if(err) return next(err);
    if(!user) {
      return next({
        status: 400,
        message: 'Unknown userId'
      });
    }
    const exercise = new Exercises(req.body)
    exercise.username = user.username;
    exercise.save((err, newExercise) => {
      if(err) return next(err)
      newExercise = newExercise.toObject();
      delete newExercise.__v;
      delete newExercise._id;
      newExercise.date = (new Date(newExercise.date)).toDateString();
      res.json({
        _id: newExercise.userId,
        username: user.username,
        description: newExercise.description,
        duration: newExercise.duration,
        date: newExercise.date
      });
    });
  });
});


// GET Requests
router.get('/users', (req, res, next) => {
  Users.find({}, (err, data) => {
    data = data.map(({username, _id}) => ({username, _id}) );
    res.json(data);
  });
});


router.get("/log", (req, res, next) => {
  var { userId, from, to, limit } = req.query;
  
  Users.findById(userId, (err, user) => {
    if (!user) {
      return next({ status: 400, message: 'Unknown userId' });
    }
    if (err) return next(err);
    Exercises.find({ userId: user._id }).sort({ date: -1 }).exec( (err, log) => {
      if (from) {
        from = new Date(from);
        log = log.filter(exercise => exercise.date >= from);
        from = from.toDateString();
      }
      if (to) {
        to = new Date(to);
        log = log.filter(exercise => exercise.date <= to);
        to = to.toDateString();
      }
      if (limit) {
        log = log.slice(0, limit);
      }
      log = log.map(({description, duration, date}) => ({
        description,
        duration,
        date: date.toDateString()
      }));      
      res.json({
        userId: userId,
        username: user.username,
        from: to,
        to: to,
        count: log.length,
        log: log
      });
    });
  });
});


module.exports = router