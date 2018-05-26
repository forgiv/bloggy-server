const router = require('express').Router()
const User = require('../models/user')

router.post('/', (req, res, next) => {
  const user = new User({ username: req.username, password: req.password, blog: req.blog })
  user.validate()
    .then(result => console.log(result))
    .catch(err => console.log(err))
})
