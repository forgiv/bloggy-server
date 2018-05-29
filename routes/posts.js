const passport = require('passport')
const router = require('express').Router()
const mongoose = require('mongoose')

const Post = require('../models/post')
const {
  requiredFields,
  validateLengths,
  validateSpaceAround,
  validateSpaceInside
} = require('../utils/validate')

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
  let err

  err = requiredFields(req.body, fields)
  if (!err) {
    return res.status(422).json(err)
  }

  for (field in fields) newPost[field] = req.body[field]

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
  err = validateLengths(newPost, sizedFields)
  if (!err) {
    return res.status(422).json(err)
  }

  err = validateSpaceAround(newPost, fields)
  if (!err) {
    return res.status(422).json(err)
  }

  err = validateSpaceInside(newPost, ['slug'])
  if (!err) {
    return res.status(422).json(err)
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
