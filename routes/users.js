const router = require(`express`).Router()
const User = require(`../models/user`)
const Post = require('../models/post')
const passport = require('passport')

// Get data for logged in user
const jwtAuth = passport.authenticate('jwt', {
  session: false,
  failWithError: true
})
router.get('/', jwtAuth, (req, res, next) => {
  res.json(req.user)
})

// Register new user
router.post(`/`, (req, res, next) => {
  const requiredFields = [`username`, `password`, 'blog']
  const missingField = requiredFields.find(field => !(field in req.body))

  if (missingField) {
    return res.status(422).json({
      code: 422,
      reason: `ValidationError`,
      message: `Missing field`,
      location: missingField
    })
  }

  const stringFields = [`username`, `password`, `blog`]
  const nonStringField = stringFields.find(
    field => field in req.body && typeof req.body[field] !== `string`
  )

  if (nonStringField) {
    return res.status(422).json({
      code: 422,
      reason: `ValidationError`,
      message: `Incorrect field type: expected string`,
      location: nonStringField
    })
  }

  const explicityTrimmedFields = [`username`, `password`, 'blog']
  const nonTrimmedField = explicityTrimmedFields.find(
    field => req.body[field].trim() !== req.body[field]
  )

  if (nonTrimmedField) {
    return res.status(422).json({
      code: 422,
      reason: `ValidationError`,
      message: `Cannot start or end with whitespace`,
      location: nonTrimmedField
    })
  }

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
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      `min` in sizedFields[field] &&
      req.body[field].trim().length < sizedFields[field].min
  )
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      `max` in sizedFields[field] &&
      req.body[field].trim().length > sizedFields[field].max
  )

  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: `ValidationError`,
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    })
  }

  const newUser = {
    username: req.body.username,
    blog: req.body.blog
  }

  User.hashPassword(req.body.password)
    .then(hash => {
      newUser.password = hash
      return User.create(newUser)
    })
    .then(user => {
      return res
        .status(201)
        .location(`${req.originalUrl}/${user.id}`)
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

// Get name of users blog
router.get('/:username', (req, res, next) => {
  const { username } = req.params
  User.findOne({ username })
    .then(user => {
      if (!user) {
        const err = new Error('User does not exist')
        err.status = 404
        return next(err)
      }
      res.json({ blog: user.blog })
    })
    .catch(next)
})

// Get all posts by user with username
router.get('/:username/posts', (req, res, next) => {
  const { username } = req.params
  User.findOne({ username })
    .then(user => {
      if (!user) {
        const err = new Error('User does not exist')
        err.status = 404
        return next(err)
      }
      return Post.find({ userId: user.id })
    })
    .then(posts => {
      res.json(posts)
    })
    .catch(next)
})

// Get single post by user with username and slug
router.get('/:username/:slug', (req, res, next) => {
  const { username, slug } = req.params
  User.findOne({ username })
    .then(user => {
      if (!user) {
        const err = new Error('User does not exist')
        err.status = 404
        return next(err)
      }
      return Post.findOne({ userId: user.id, slug })
    })
    .then(post => {
      if (!post) {
        const err = new Error('Post does not exist')
        err.status = 404
        return next(err)
      } else res.json(post)
    })
    .catch(next)
})

module.exports = router
