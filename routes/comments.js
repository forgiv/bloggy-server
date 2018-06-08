const passport = require('passport')
const mongoose = require('mongoose')
const router = require('express').Router()

const Comment = require('../models/comment')
const User = require('../models/user')
const Post = require('../models/post')

const {
  validateLengths,
  validateSpaceAround,
  requiredFields
} = require('../utils/validate')

// Get all comments on a post
router.get('/:username/:slug', (req, res, next) => {
  const { username, slug } = req.params

  User.findOne({ username })
    .then(user => {
      if (!user) return next()
      return Post.findOne({ userId: user.id, slug })
    })
    .then(post => {
      if (!post) return next()
      return Comment.find({ postId: post.id })
        .sort({ createdAt: 'desc' })
        .populate('userId', 'username')
    })
    .then(comments => {
      res.json(comments)
    })
    .catch(next)
})

// Protect endpoints after this
const jwtAuth = passport.authenticate('jwt', {
  session: false,
  failWithError: true
})

// Create new comment
router.post('/', jwtAuth, (req, res, next) => {
  const { postId, content } = req.body
  const userId = req.user.id
  let err

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }

  err = requiredFields(req.body, ['content', 'postId'])
  if (err) {
    return res.status(422).json(err)
  }

  const sizedFields = { content: { min: 3, max: 300 } }
  err = validateLengths({ content }, sizedFields)
  if (err) {
    return res.status(422).json(err)
  }

  err = validateSpaceAround({ content }, ['content'])
  if (err) {
    return res.status(422).json(err)
  }

  Post.findById(postId)
    .then(post => {
      if (!post) return next()
      return Comment.create({ postId, content, userId })
    })
    .then(comment => {
      return res
        .status(201)
        .location(`${req.originalUrl}/${comment.id}`)
        .json(comment)
    })
    .catch(next)
})

module.exports = router
