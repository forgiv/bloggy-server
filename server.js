require('dotenv').config()

const express = require('express')
const morgan = require('morgan')
const mongoose = require('mongoose')
const passport = require('passport')

const { PORT, MONGODB_URI } = require('./config')
const localStrategy = require('./passport/local')
const jwtStrategy = require('./passport/jwt')

const authRouter = require('./routes/auth')
const userRouter = require('./routes/users')
const postRouter = require('./routes/posts')

/** Post-MVP  **/
// const commentRouter = require('./routers/comments')
// const rssRouter = require('./routers/rss')
// const dashboardRouter = require('./routers/dashboard')

passport.use(localStrategy)
passport.use(jwtStrategy)

const app = express()

// More verbose logging while in development
// Skip logging when testing
app.use(
  morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'common', {
    skip: () => process.env.NODE_ENV === 'test'
  })
)
// Parse json in request
app.use(express.json())

// Mount routers
app.use('/api', authRouter)
app.use('/api/users', userRouter)
app.use('/api/posts', postRouter)

/** Post-MVP  **/
// app.use('/api/comments', commentRouter)
// app.use('/api/dashboard', dashboardRouter)
// app.use('/api/rss', rssRouter)

// Catch-all 404
app.use(function(req, res, next) {
  const err = new Error('Not Found')
  err.status = 404
  next(err)
})

// Catch-all Error handler
// Add NODE_ENV check to prevent stacktrace leak
app.use(function(err, req, res, next) {
  res.status(err.status || 500)
  res.json({
    message: err.message,
    error: app.get('env') === 'development' ? err : {}
  })
})

if (require.main === module) {
  mongoose
    .connect(MONGODB_URI)
    .then(instance => {
      const conn = instance.connections[0]
      console.info(
        `Connected to: mongodb://${conn.host}:${conn.port}/${conn.name}`
      )
    })
    .catch(err => {
      console.error(`ERROR: ${err.message}`)
      console.error('\n === Did you remember to start `mongod`? === \n')
      console.error(err)
    })

  app
    .listen(PORT, function() {
      console.info(`Server listening on ${this.address().port}`)
    })
    .on('error', err => {
      console.error(err)
    })
}

module.exports = app
