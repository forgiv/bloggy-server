const app = require(`../server`)
const chai = require(`chai`)
const chaiHttp = require(`chai-http`)
const mongoose = require(`mongoose`)

const { TEST_MONGODB_URI } = require(`../config`)

const User = require(`../models/user`)
const Post = require('../models/post')
const Comment = require('../models/comment')
const seedUsers = require('../db/seed/users')
const seedPosts = require(`../db/seed/posts`)
const seedComments = require('../db/seed/comments')

const expect = chai.expect

chai.use(chaiHttp)

const testUser = { username: `user0`, password: `password` }
const testId = `333333333333333333333300`
const testPost = '000000000000000000000001'

describe(`Bloggy API - Comments`, function() {
  let token

  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase())
  })

  beforeEach(function() {
    return Promise.all([
      User.insertMany(seedUsers),
      Post.insertMany(seedPosts),
      Comment.insertMany(seedComments)
    ])
      .then(() =>
        Promise.all([
          User.createIndexes(),
          Post.createIndexes(),
          Comment.createIndexes()
        ])
      )
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

  describe(`GET /api/comments`, function() {
    it(`should return the correct number of items`, function() {
      return Promise.all([
        Comment.find({ userId: testId }),
        chai
          .request(app)
          .get(`/api/comments`)
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
        Comment.find({ userId: testId }),
        chai
          .request(app)
          .get(`/api/comments`)
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
            'userId',
            'postId',
            'createdAt',
            'updatedAt',
            'content'
          )
        })
      })
    })
  })

  describe(`GET /api/comments/:id`, function() {
    it(`should return correct item`, function() {
      let data
      return Comment.findOne({ userId: testId })
        .then(_data => {
          data = _data
          return chai
            .request(app)
            .get(`/api/comments/${data.id}`)
            .set(`authorization`, `Bearer ${token}`)
        })
        .then(res => {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.an(`object`)
          expect(res.body).to.have.keys(
            `id`,
            'content',
            'userId',
            'postId',
            'createdAt',
            'updatedAt'
          )
          expect(res.body.id).to.equal(data.id)
          expect(res.body.content).to.equal(data.content)
        })
    })

    it(`should respond with status 400 and an error message when \`id\` is not valid`, function() {
      return chai
        .request(app)
        .get(`/api/comments/INVALID`)
        .set(`authorization`, `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq(`The \`id\` is not valid`)
        })
    })
  })

  describe(`Post /api/comments`, function() {
    it(`should create and return a new item when provided valid data`, function() {
      let res
      const newItem = {
        postId: testPost,
        content: `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor...`
      }
      return chai
        .request(app)
        .post(`/api/comments`)
        .send(newItem)
        .set(`authorization`, `Bearer ${token}`)
        .then(_res => {
          res = _res
          expect(res).to.have.status(201)
          expect(res).to.have.header(`location`)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body).to.have.keys(
            `id`,
            'content',
            'userId',
            'postId',
            'createdAt',
            'updatedAt'
          )
          return Comment.findById(res.body.id)
        })
        .then(data => {
          expect(res.body.content).to.equal(data.content)
        })
    })

    it(`should return an error when commenting an object with a missing "content" field`, () => {
      const newItem = {
        postId: testPost
      }

      return chai
        .request(app)
        .post(`/api/comments`)
        .set(`authorization`, `Bearer ${token}`)
        .send(newItem)
        .then(res => {
          expect(res).to.have.status(422)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body.message).to.equal(`Missing content in request body`)
        })
    })
  })

  describe(`PUT /api/comments/:id`, () => {
    it(`should update the Comment when provided valid data`, () => {
      const updateItem = {
        content: `woof woof mother trrucker`
      }
      let data
      return Comment.findOne({ userId: testId })
        .then(_data => {
          data = _data
          return chai
            .request(app)
            .put(`/api/comments/${data.id}`)
            .set(`authorization`, `Bearer ${token}`)
            .send(updateItem)
        })
        .then(function(res) {
          expect(res).to.have.status(200)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body).to.have.keys(
            `id`,
            'content',
            'userId',
            'postId',
            'createdAt',
            'updatedAt'
          )

          expect(res.body.id).to.equal(data.id)
          expect(res.body.content).to.equal(updateItem.content)
        })
    })

    it(`should respond with status 400 and an error message when \`id\` is not valid`, function() {
      const updateItem = {
        title: `What about dogs?!`,
        content: `woof woof`
      }

      return chai
        .request(app)
        .put(`/api/comments/INVALID`)
        .set(`authorization`, `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(400)
          expect(res.body.message).to.eq(`The \`id\` is not valid`)
        })
    })

    it(`should respond with a 404 for a missing id`, function() {
      const updateItem = {
        title: `What about dogs?!`,
        content: `woof woof mother trruckerrr`
      }

      return chai
        .request(app)
        .put(`/api/comments/333333333333333333333300`)
        .set(`authorization`, `Bearer ${token}`)
        .send(updateItem)
        .then(res => {
          expect(res).to.have.status(404)
        })
    })

    it(`should return an error when missing update fields`, function() {
      const updateItem = {}
      let data
      return Comment.findOne({ userId: testId })
        .then(_data => {
          data = _data
          return chai
            .request(app)
            .put(`/api/comments/${data.id}`)
            .set(`authorization`, `Bearer ${token}`)
            .send(updateItem)
        })
        .then(res => {
          expect(res).to.have.status(422)
          expect(res).to.be.json
          expect(res.body).to.be.a(`object`)
          expect(res.body.message).to.equal(`Missing content in request body`)
        })
    })
  })

  describe(`DELETE /api/comments/:id`, function() {
    it(`should delete an existing document and respond with 204`, function() {
      let data
      return Comment.findOne({ userId: testId })
        .then(_data => {
          data = _data
          return chai
            .request(app)
            .delete(`/api/comments/${data.id}`)
            .set(`authorization`, `Bearer ${token}`)
        })
        .then(function(res) {
          expect(res).to.have.status(204)
          return Comment.count({ _id: data.id })
        })
        .then(count => {
          expect(count).to.equal(0)
        })
    })

    it(`should respond with 204 when document does not exist`, function() {
      return chai
        .request(app)
        .delete(`/api/comments/333333333333333333333300`)
        .set(`authorization`, `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(204)
        })
    })
  })
})
