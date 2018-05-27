const router = require(`express`).Router()
const User = require(`../models/user`)

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
      message: tooSmallField ?
        `Must be at least ${sizedFields[tooSmallField].min} characters long` : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
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

module.exports = router
