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
      max: 32
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

// Update existing post
router.put('/:id', (req, res, next) => {
  const userId = req.user.id
  const { id } = req.params

  if (!mongoose.Types.ObjectId.isValid(id)) {
    const err = new Error(`The \`id\` is not valid`)
    err.status = 400
    return next(err)
  }

  const fields = ['title', 'content', 'slug']
  const updateObj = {}

  for (const field of fields) {
    if (field in req.body) {
      updateObj[field] = req.body[field]
    }
  }

  if (Object.keys(updateObj).length === 0) {
    const err = new Error('Missing update fields in request body')
    err.status = 400
    return next(err)
  }

  let err
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
  const newSizedFields = {}
  for (const key of Object.keys(updateObj)) {
    if (key in sizedFields) {
      newSizedFields[key] = sizedFields[key]
    }
  }
  err = validateLengths(updateObj, newSizedFields)
  if (err) {
    return res.status(422).json(err)
  }

  err = validateSpaceAround(updateObj, fields)
  if (err) {
    return res.status(422).json(err)
  }

  err = validateSpaceInside(updateObj, ['slug'])
  if (err) {
    return res.status(422).json(err)
  }

  Post.findOne({ _id: id })
    .then(post => {
      if (!post) return next()
      if ('' + post.userId !== userId) {
        const err = new Error('Forbidden')
        err.status = 403
        return next(err)
      }
    })
    .then(() => {
      return Post.findOneAndUpdate(
        { _id: id },
        { $set: { ...updateObj } },
        { new: true }
      )
    })
    .then(result => {
      if (result) res.json(result)
      else next()
    })
    .catch(next)
})

// Delete existing post
router.delete('/:id', (req, res, next) => {
  const { id } = req.params
  const userId = req.user.id

  Post.findOneAndRemove({ _id: id, userId })
    .then(() => {
      res.status(204).end()
    })
    .catch(next)
})

module.exports = router
