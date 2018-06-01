const mongoose = require('mongoose')

const commentSchema = mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true
    },
    content: { type: String, required: true }
  },
  { timestamps: true }
)

commentSchema.set('toObject', {
  transform: (doc, ret) => {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
  }
})

module.exports = mongoose.model('Comment', commentSchema)
