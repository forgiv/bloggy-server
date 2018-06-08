const router = require(`express`).Router()
const passport = require('passport')

const User = require(`../models/user`)
const Post = require('../models/post')
const {
  requiredFields,
  validateLengths,
  validateSpaceAround,
  validateSpaceInside
} = require('../utils/validate')

// Get data for logged in user
const jwtAuth = passport.authenticate('jwt', {
  session: false,
  failWithError: true
})

// Get public data for user with :username
router.get('/:username', (req, res, next) => {
  const { username } = req.params
  User.findOne({ username })
    .then(user => {
      if (!user) {
        const err = new Error('User does not exist')
        err.status = 404
        return next(err)
      }
      res.json({username:user.username, blog:user.blog})
    })
    .catch(next)
}))

// Get data for logged in user
router.get('/', jwtAuth, (req, res, next) => {
  res.json(req.user)
})

// Register new user
router.post(`/`, (req, res, next) => {
  const fields = ['username', 'password', 'blog']
  const newUser
  let err
  
  err = requiredFields(req.body, fields)
  if (err) return res.status(422).json(err)

  for (const field of fields) newUser[field] = '' + req.body[field]

  const sizedFields = {
    username: {
      min: 3
    },
    password: {
      min: 6,
      max: 72
    },
    blog: {
      min: 3,
      max: 72
    }
  }
  err = validateLengths(newUser, sizedFields)
  if (err) return res.status(422).json(err)
  
  err = validateSpaceAround(newUser, fields)
  if (err) return res.status(422).json(err)
  
  err = validateSpaceInside(newUser, ['username'])
  if (err) return res.status(422).json(err)

  User.hashPassword(newUser.password)
    .then(hash => {
      newUser.password = hash
      return User.create(newUser)
    })
    .then(user => {
      return res
        .status(201)
        .location(`${req.originalUrl}/${user.username}`)
        .json(user)
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error(`Username already exists`)
        err.status = 400
      }
      next(err)
    })
})

module.exports = router
