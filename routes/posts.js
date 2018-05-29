const passport = require('passport')
const router = require('express').Router()
const mongoose = require('mongoose')

const Post = require('../models/post')

// Protect all router endpoints
router.use(
  '/',
  passport.authenticate('jwt', { session: false, failWithError: true })
)

// Get all posts for user
router.get('/', (req, res, next) => {
  const userId = req.user.id

  Post.find({ userId })
    .sort({ createdAt: 'desc' })
    .then(posts => res.json(posts))
    .catch(next)
})

// Get a single post for user
router.get('/:id', (req, res, next) => {
  const { id } = req.params
  const userId = req.user.id

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }

  Post.findOne({ userId, _id: id })
    .then(post => {
      if (post) res.json(post)
      else next()
    })
    .catch(next)
})

// Create a new post
router.post('/', (req, res, next) => {
  const userId = req.user.id

  const newPost = { userId }
  const fields = ['title', 'content', 'slug']
  for (const field of fields) {
    if (req.body[field]) {
      newPost[field] = req.body[field]
    } else {
      const err = new Error(`Missing ${field} in request body`)
      err.status = 400
      return next(err)
    }
  }

  // Validate length of fields
  const sizedFields = {
    title: {
      min: 3,
      max: 64
    },
    content: {
      min: 16
    },
    slug: {
      min: 3,
      max: 32
    }
  }
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      newPost[field].trim().length < sizedFields[field].min
  )
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      newPost[field].trim().length > sizedFields[field].max
  )
  if (tooSmallField || tooLargeField) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    })
  }

  // Validate leading/trailing whitespace
  for (const field of fields) {
    if (newPost[field].length === newPost[field].trim().length) {
      return res.status(422).json({
        code: 422,
        reason: 'ValidationError',
        message: 'Must not have leading, or trailing, whitespace',
        location: field
      })
    }
  }

  // Validate no whitespace (slug specific)
  if (newPost.slug.includes(' ')) {
    return res.status(422).json({
      code: 422,
      reason: 'ValidationError',
      message: 'Must not contain whitespace',
      location: 'slug'
    })
  }

  Post.create(newPost)
    .then(post => {
      return res.status(201).location(`${req.originalUrl}/${post.id}`)
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Username/Title already exists')
        err.status = 400
      }
      next(err)
    })
})

module.exports = router
