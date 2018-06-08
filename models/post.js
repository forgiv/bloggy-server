const mongoose = require('mongoose')

const postSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    slug: { type: String, required: true }
  },
  { timestamps: true }
)

postSchema.index({ title: 1, user: 1 }, { unique: true })
postSchema.index({ slug: 1, user: 1 }, { unique: true })

postSchema.set('toObject', {
  transform: function(doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
  }
})

module.exports = mongoose.model('Post', postSchema)
