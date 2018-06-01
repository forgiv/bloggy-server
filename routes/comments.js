const passport = require('passport')
const mongoose = require('mongoose')
const router = require('express').Router()

const Comment = require('../models/comment')
const User = require('../models/user')
const Post = require('../models/post')

const { validateLengths, validateSpaceAround } = require('../utils/validate')

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
      return Comment.find({ postId: post.id }).populate('userId', 'username')
    })
    .then(comments => {
      res.json(comments)
    })
    .catch(next)
})

// Get comment by id
router.get('/:commentId', (req, res, next) => {
  const { commentId } = req.params

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    const err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }

  Comment.findById(commentId)
    .then(comment => {
      if (!comment) return next()
      res.json(comment)
    })
    .catch(next)
})

// Protect endpoints after this
const jwtAuth = passport.authenticate('jwt', {
  session: false,
  failWithError: true
})

// Get all of users own comments
router.get('/', jwtAuth, (req, res, next) => {
  const userId = req.user.id

  Comment.find({ userId })
    .then(comments => res.json(comments))
    .catch(next)
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
        .end()
    })
    .catch(next)
})

// Update existing comment
router.put('/:id', jwtAuth, (req, res, next) => {
  const { id } = req.params
  const { content } = req.body
  const userId = req.user.id
  let err

  if (!mongoose.Types.ObjectId.isValid(id)) {
    err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
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

  Comment.findById(id)
    .then(comment => {
      if (!comment) return next()
      if (comment.userId !== userId) return res.status(403).end()
      return Comment.findByIdAndUpdate(id, { content })
    })
    .then(comment => {
      if (comment) return res.json(comment)
      next()
    })
    .catch(next)
})

// Delete existing comment
router.delete('/:id', jwtAuth, (req, res, next) => {
  const { id } = req.params
  const userId = req.user.id

  Comment.findOneAndRemove({ _id: id, userId })
    .then(() => res.status(204).end())
    .catch(next)
})

module.exports = router
