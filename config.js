module.exports.PORT = process.env.PORT || 8080
module.exports.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost/bloggy'
module.exports.TEST_MONGODB_URI = process.env.TEST_MONGODB_URI || 'mongodb://localhost/bloggy-test'
module.exports.JWT_SECRET = process.env.JWT_SECRET
module.exports.JWT_EXPIRY = process.env.JWT_EXPIRY || '7d'