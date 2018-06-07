const app = require(`../server`)
const chai = require(`chai`)
const chaiHttp = require(`chai-http`)
const mongoose = require(`mongoose`)
const jwt = require(`jsonwebtoken`)

const { TEST_MONGODB_URI, JWT_SECRET } = require(`../config`)

const User = require(`../models/user`)

const expect = chai.expect
chai.use(chaiHttp)

describe(`Bloggy API - Login`, function() {
  const username = `exampleUser`
  const password = `password`
  const blogName = `test blog`

  before(function() {
    return mongoose
      .connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase())
  })

  beforeEach(function() {
    return User.hashPassword(password).then(hash => {
      return User.create({ username, password: hash, blog: blogName })
    })
  })

  afterEach(function() {
    return mongoose.connection.db.dropDatabase()
  })

  after(function() {
    return mongoose.disconnect()
  })

  it(`Should return a valid auth token`, function() {
    return chai
      .request(app)
      .post(`/api/login`)
      .send({ username, password })
      .then(res => {
        expect(res).to.have.status(200)
        expect(res.body).to.be.an(`object`)
        expect(res.body.authToken).to.be.a(`string`)

        const payload = jwt.verify(res.body.authToken, JWT_SECRET)

        expect(payload.user).to.not.have.property(`password`)
        expect(payload.user.username).to.equal(username)
        expect(payload.user.blog).to.equal(blogName)
      })
  })

  it(`Should reject requests with no credentials`, () => {
    return chai
      .request(app)
      .post(`/api/login`)
      .then(res => {
        expect(res).to.have.status(400)
        expect(res.body.message).to.eq(`Bad Request`)
      })
  })
  it(`Should reject requests with incorrect usernames`, () => {
    return chai
      .request(app)
      .post(`/api/login`)
      .send({ username: `aufhauilsfhasd`, password })
      .then(res => {
        expect(res).to.have.status(401)
        expect(res.body.message).to.eq(`Incorrect Username`)
      })
  })
  it(`Should reject requests with incorrect passwords`, () => {
    return chai
      .request(app)
      .post(`/api/login`)
      .send({ username, password: `adijasasfdfifa` })
      .then(res => {
        expect(res).to.have.status(401)
        expect(res.body.message).to.eq(`Incorrect Password`)
      })
  })

  describe(`/api/refresh`, function() {
    it(`should return a valid auth token with a newer expiry date`, function() {
      const user = { username }
      const token = jwt.sign({ user }, JWT_SECRET, {
        subject: username,
        expiresIn: `1m`
      })
      const decoded = jwt.decode(token)

      return chai
        .request(app)
        .post(`/api/refresh`)
        .set(`Authorization`, `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(200)
          expect(res.body).to.been.a(`object`)
          const authToken = res.body.authToken
          expect(authToken).to.be.a(`string`)

          const payload = jwt.verify(authToken, JWT_SECRET)
          expect(payload.user).to.deep.equal({ username })
          expect(payload.exp).to.be.greaterThan(decoded.exp)
        })
    })

    it(`should reject requests with no credentials`, () => {
      return chai
        .request(app)
        .post(`/api/refresh`)
        .then(res => {
          expect(res).to.have.status(401)
        })
    })

    it(`should reject requests with an invalid token`, () => {
      return chai
        .request(app)
        .post(`/api/refresh`)
        .set(`Authorization`, `Bearer ausdhflaiudhsfaluhlsdi`)
        .then(res => {
          expect(res).to.have.status(401)
        })
    })

    it(`should reject requests with an expired token`, () => {
      const user = { username }
      const token = jwt.sign({ user }, JWT_SECRET, {
        subject: username,
        expiresIn: `0`
      })

      return chai
        .request(app)
        .post(`/api/refresh`)
        .set(`Authorization`, `Bearer ${token}`)
        .then(res => {
          expect(res).to.have.status(401)
        })
    })
  })
})
