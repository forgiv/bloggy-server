const mongoose = require('mongoose')

const postSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: { type: String, required: true },
  content: String,
  slug: String
}, { timestamps: true })

postSchema.index({ title: 1, userId: 1 }, { unique: true })

postSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
  }
})

module.exports = mongoose.model('Post', postSchema)
