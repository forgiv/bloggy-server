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

// jwt authentication method
const jwtAuth = passport.authenticate('jwt', {
  session: false,
  failWithError: true
})

// Get comment by id
router.get('/:id', (req, res, next) => {
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }

  Comment.findById(id)
    .then(comment => {
      if (!comment) return next()
      res.json(comment)
    })
    .catch(next)
})

// Get comments for post
router.get('/', (req, res, next) => {
  const { postId } = req.query
  
  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }
  
  Comment.find({post:postId})
    .then(comments => res.json(comments))
    .catch(next)
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
  const fields = ['content', 'postId']
  const newComment = { user:userId }
  let err

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    err = new Error('The `id` is not valid')
    err.status = 400
    return next(err)
  }

  err = requiredFields(req.body, )
  if (err) return res.status(422).json(err)
  
  for (const field of fields) newComment[field] = req.body[field]

  const sizedFields = { content: { min: 3, max: 300 } }
  err = validateLengths(newComment, sizedFields)
  if (err) return res.status(422).json(err)

  err = validateSpaceAround(newComment, ['content'])
  if (err) return res.status(422).json(err)

  Post.findById(postId)
    .then(post => {
      if (!post) return next()
      return Comment.create(newComment)
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
