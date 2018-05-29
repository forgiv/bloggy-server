const passport = require('passport')
const router = require("express").Router()
const mongoose = require('mongoose')

const Post = require('../models/post')

// Protect all router endpoints
router.use('/', passport.authenticate('jwt', { session: false, failWithError: true }))

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
      if (post)
        res.json(post)
      else
        next()
    })
    .catch(next)
})

// Create a new post
router.post('/', (req, res, next) => {
  const userId = req.user.id

  const newPost = {}
  const fields = ['title', 'content', 'slug']
  for (const field of fields) {
    if (req.body[field]) {
      newPost[field] = req.body[field]
    }
    else {
      const err = new Error(`Missing ${field} in request body`)
      err.status = 400
      return next(err)
    }
  }

  if (newPost.title.length < 3) {
    
  }
  if (newPost.content.length < 16) {

  }
})
