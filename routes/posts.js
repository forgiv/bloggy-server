const router = require('express').Router()
const passport = require('passport')
const mongoose = require('mongoose')

const Post = require('../models/post')
const User = require('../models/user')
const {
  requiredFields,
  validateLengths,
  validateSpaceAround,
  validateSpaceInside
} = require('../utils/validate')

// jwt authentication method
const jwtAuth = passport.authenticate('jwt'. {session: false, failWithError:true})

// Get all posts
// query by username for multiple posts
// query by username and slug for a single post
router.get('/', (req, res, next) => {
  const {username, slug} = req.query
  
  if (!username && !slug) return next()
  
  User.findOne({username})
    .then(user => {
      if (!user) return next()
      if (slug) return Post.findOne({user:user.id, slug})
      return Post.find({user:user.id})
    })
    .then(result => {
      res.json(result)
    })
    .catch(next)
})

// Get all posts for logged in user
router.get('/', jwtAuth, (req, res, next) => {
  const userId = req.user.id

  Post.find({ user: userId })
    .sort({ createdAt: 'desc' })
    .then(posts => res.json(posts))
    .catch(next)
})

// Create a new post
router.post('/', jwtAuth, (req, res, next) => {
  const userId = req.user.id

  const newPost = { user:userId }
  const fields = ['title', 'content', 'slug']
  let err

  err = requiredFields(req.body, fields)
  if (err) return res.status(422).json(err)

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
      max: 32
    }
  }
  err = validateLengths(newPost, sizedFields)
  if (err) return res.status(422).json(err)

  err = validateSpaceAround(newPost, fields)
  if (err) return res.status(422).json(err)

  err = validateSpaceInside(newPost, ['slug'])
  if (err) return res.status(422).json(err)

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
