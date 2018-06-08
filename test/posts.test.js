const app = require(`../server`)
const chai = require(`chai`)
const chaiHttp = require(`chai-http`)
const mongoose = require(`mongoose`)

const { TEST_MONGODB_URI } = require(`../config`)

const User = require(`../models/user`)
const Post = require(`../models/post`)
const seedUsers = require('../db/seed/users')
const seedPosts = require(`../db/seed/posts`)

const expect = chai.expect

chai.use(chaiHttp)

const testUser = { username: `user0`, password: `password` }
const testId = `333333333333333333333300`

describe(`Bloggy API - Posts`, function() {
  let token

  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase())
  })

  beforeEach(function() {
    return Promise.all([User.insertMany(seedUsers), Post.insertMany(seedPosts)])
      .then(() => Promise.all([User.createIndexes(), Post.createIndexes()]))
      .then(() =>
        chai
          .request(app)
          .post(`/api/login`)
          .send(testUser)
      )
      .then(res => {
        token = res.body.authToken
      })
  })

  afterEach(function() {
    return mongoose.connection.db.dropDatabase()
  })

  after(function() {
    return mongoose.disconnect()
  })

  describe(`GET /api/posts`, function() {
    it(`should return the correct number of Posts`, function() {
      return Promise.all([
        Post.find({ userId: testId }),
        chai
          .request(app)
          .get(`/api/posts`)
          .set(`authorization`, `Bearer ${token}`)
      ]).then(([data, res]) => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body).to.be.a(`array`)
        expect(res.body).to.have.length(data.length)
      })
    })

    it(`should return a list with the correct fields`, function() {
      return Promise.all([
        Post.find({ userId: testId }),
        chai
          .request(app)
          .get(`/api/posts`)
          .set(`authorization`, `Bearer ${token}`)
      ]).then(([data, res]) => {
        expect(res).to.have.status(200)
        expect(res).to.be.json
        expect(res.body).to.be.a(`array`)
        expect(res.body).to.have.length(data.length)
        res.body.forEach(function(item) {
          expect(item).to.be.a(`object`)
          expect(item).to.have.keys(
            `id`,
            `title`,
            `content`,
            `createdAt`,
            `updatedAt`,
            `userId`,
            `slug`
          )
        })
      })
    })
  })

  describe(`GET /api/posts/:id`, function() {
    it(`should return correct Post`, function() {
      let data
      return Post.findOne({ userId: testId })
        .then(_data => {
          data = _data
          return chai
            .request(app)
            .get(`/api/posts/${data.id}`)
            .set(`authorization`, `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an(`object`)
          expect(res.body).to.have.keys(
            `id`,
            `title`,
            `content`,
            `createdAt`,
            `updatedAt`,
            `userId`,
            `slug`
          )
          expect(res.body.id).to.equal(data.id)
          expect(res.body.title).to.equal(data.title)
          expect(res.body.content).to.equal(data.content)
        })
    })

    it(`should respond with status 400 and an error message when \`id\` is not valid`, function() {
      return chai
        .request(app)
        .get(`/api/posts/INVALID`)
        .set(`authorization`, `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq(`The \`id\` is not valid`)
        })
    })
  })

  describe(`POST /api/posts`, function() {
    it(`should create and return a new item when provided valid data`, function() {
      const newItem = {
        title: `The best article about cats ever!`,
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...`,
        slug: `this-is-a-new-post`
      }
      let res
      return chai
        .request(app)
        .post(`/api/posts`)
        .send(newItem)
        .set(`authorization`, `Bearer ${token}`)
        .then(function(_res) {
          res = _res
          expect(res).to.have.status(201)
          expect(res).to.have.header(`location`)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body).to.have.keys(
            `id`,
            `title`,
            `content`,
            `createdAt`,
            `updatedAt`,
            `userId`,
            `slug`
          )
          return Post.findById(res.body.id)
        })
        .then(data => {
          expect(res.body.title).to.equal(data.title)
          expect(res.body.content).to.equal(data.content)
          expect(res.body.slug).to.equal(data.slug)
        })
    })

    it(`should return an error when posting an object with a missing "title" field`, function() {
      const newItem = {
        content: `Lorem ipsum dolor sit amet, sed do eiusmod tempor...`,
        slug: 'this-a-a-slug'
      }

      return chai
        .request(app)
        .post(`/api/posts`)
        .set(`authorization`, `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(422)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body.message).to.equal(`Missing title in request body`)
        })
    })
  })
})
