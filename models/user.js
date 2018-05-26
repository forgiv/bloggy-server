const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = mongoose.Schema({
  username: { type: String, required: [true, 'missing username'], unique: true },
  password: { type: String, required: [true, 'missing password'] },
  blog: { type: String, required: [true, 'missing blog name'] }
})

userSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id
    delete ret._it
    delete ret.__v
    delete ret.password
  }
})

userSchema.statics.hasPassword = password => {
  return bcrypt.hash(password, 10)
}

userSchema.methods.validatePassword = function(password) {
  return bcrypt.compare(password, this.password)
}

const User = mongoose.model('User', userSchema)

module.exports = User