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

// Create a new post
router.post('/', (req, res, next) => {
  const userId = req.user.id

  const newPost = { userId }
  const fields = ['title', 'content', 'slug']
  let err

  err = requiredFields(req.body, fields)
  if (err) {
    return res.status(422).json(err)
  }

  for (field of fields) newPost[field] = req.body[field]

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
      max: 64
    }
  }
  err = validateLengths(newPost, sizedFields)
  if (err) {
    return res.status(422).json(err)
  }

  err = validateSpaceAround(newPost, fields)
  if (err) {
    return res.status(422).json(err)
  }

  err = validateSpaceInside(newPost, ['slug'])
  if (err) {
    return res.status(422).json(err)
  }

  Post.create(newPost)
    .then(post => {
      return res
        .status(201)
        .location(`${req.originalUrl}/${post.id}`)
        .json(post)
    })
    .catch(err => {
      if (err.code === 11000) {
        err = new Error('Slug/Title already exists')
        err.status = 400
      }
      next(err)
    })
})

module.exports = router
