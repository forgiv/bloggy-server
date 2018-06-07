const app = require(`../server`)
const chai = require(`chai`)
const chaiHttp = require(`chai-http`)
const mongoose = require(`mongoose`)

const { TEST_MONGODB_URI } = require(`../config`)

const User = require(`../models/user`)

const expect = chai.expect

chai.use(chaiHttp)

describe(`Bloggy API - Users`, function() {
  const username = `exampleUser`
  const password = `examplePass`
  const blogName = `test blog`

  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase())
  })

  beforeEach(function() {
    return User.createIndexes()
  })

  afterEach(function() {
    return mongoose.connection.db.dropDatabase()
  })

  after(function() {
    return mongoose.disconnect()
  })

  describe(`/api/users`, function() {
    describe(`POST`, function() {
      it(`Should create a new user`, function() {
        const testUser = { username, password, blog: blogName }

        let res
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(_res => {
            res = _res
            expect(res).to.have.status(201)
            expect(res.body).to.be.an(`object`)
            expect(res.body).to.have.keys(`id`, `username`, `blog`)

            expect(res.body.id).to.exist
            expect(res.body.username).to.equal(testUser.username)
            expect(res.body.blog).to.equal(testUser.blog)

            return User.findOne({ username })
          })
          .then(user => {
            expect(user).to.exist
            expect(user.id).to.equal(res.body.id)
            expect(user.blog).to.equal(testUser.blog)
            return user.validatePassword(password)
          })
          .then(isValid => {
            expect(isValid).to.be.true
          })
      })
      it(`Should reject users with missing username`, function() {
        const testUser = { password, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(`Missing field`)
            expect(res.body.location).to.eq(`username`)
          })
      })

      it(`Should reject users with missing password`, () => {
        const testUser = { username, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(`Missing field`)
            expect(res.body.location).to.eq(`password`)
          })
      })
      it(`Should reject users with non-string username`, () => {
        const testUser = { password, username: 1231233123, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(
              `Incorrect field type: expected string`
            )
            expect(res.body.location).to.eq(`username`)
          })
      })
      it(`Should reject users with non-string password`, () => {
        const testUser = { password: 123612312, username, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(
              `Incorrect field type: expected string`
            )
            expect(res.body.location).to.eq(`password`)
          })
      })
      it(`Should reject users with non-trimmed username`, () => {
        const testUser = { password, username: `${username} `, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(
              `Cannot start or end with whitespace`
            )
            expect(res.body.location).to.eq(`username`)
          })
      })
      it(`Should reject users with non-trimmed password`, () => {
        const testUser = { password: `${password} `, username, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(
              `Cannot start or end with whitespace`
            )
            expect(res.body.location).to.eq(`password`)
          })
      })
      it(`Should reject users with empty username`, () => {
        const testUser = { password, username: ``, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(`Must be at least 3 characters long`)
            expect(res.body.location).to.eq(`username`)
          })
      })
      it(`Should reject users with password less than 6 characters`, () => {
        const testUser = { password: `167h`, username, blog: blogName }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(`Must be at least 6 characters long`)
            expect(res.body.location).to.eq(`password`)
          })
      })
      it(`Should reject users with password greater than 72 characters`, () => {
        const testUser = {
          password: `12g67h`.repeat(20),
          username,
          blog: blogName
        }
        return chai
          .request(app)
          .post(`/api/users`)
          .send(testUser)
          .then(res => {
            expect(res).have.status(422)
            expect(res.body.message).to.eq(`Must be at most 72 characters long`)
            expect(res.body.location).to.eq(`password`)
          })
      })
      it(`Should reject users with duplicate username`, () => {
        const testUser = { password, blog: blogName, username }
        return User.create(testUser)
          .then(() =>
            chai
              .request(app)
              .post(`/api/users`)
              .send(testUser)
          )
          .then(res => {
            expect(res).have.status(400)
            expect(res.body.message).to.eq(`Username already exists`)
          })
      })
    })
  })
})
