/**
 * Checks body for keys in fields
 * @param {Object} body
 * @param {string[]} fields
 * @returns {Object|null} Error object if err, else null
 */
const requiredFields = (body, fields) => {
  for (const field of fields) {
    if (!body[field]) {
      const err = {
        code: 422,
        reason: 'ValidationError',
        message: `Missing ${field} in request body`,
        location: field
      }
      console.log(err)
      return err
    }
  }
  return null
}

/**
 * Checks values in body are appropriate length
 * @param {Object} body
 * @param {Object.<string, Object.<string, number>} sizedFields
 * @param {number} sizedFields[field].min
 * @param {number} sizedFields[field].max
 * @returns {Object|null} Error object if err, else null
 */
const validateLengths = (body, sizedFields) => {
  const tooSmallField = Object.keys(sizedFields).find(
    field =>
      'min' in sizedFields[field] &&
      body[field].trim().length < sizedFields[field].min
  )
  const tooLargeField = Object.keys(sizedFields).find(
    field =>
      'max' in sizedFields[field] &&
      body[field].trim().length > sizedFields[field].max
  )
  if (tooSmallField || tooLargeField) {
    const err = {
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    }
    console.log(err)
    return err
  }
  return null
}

/**
 * Checks body values for leading/trailing whitespace
 * @param {Object} body
 * @param {string[]} fields
 * @returns {Object|null} Error object if err, else null
 */
const validateSpaceAround = (body, fields) => {
  for (const field of fields) {
    if (field in body) {
      if (body[field].length > body[field].trim().length) {
        const err = {
          code: 422,
          reason: 'ValidationError',
          message: 'Must not have leading, or trailing, whitespace',
          location: field
        }
        console.log(err)
        return err
      }
    }
  }
  return null
}

/**
 * Checks body values for any whitespace
 * @param {Object} body
 * @param {string[]} fields
 * @returns {Object|null} Error object if err, else null
 */
const validateSpaceInside = (body, fields) => {
  for (const field of fields) {
    if (field in body) {
      if (body[field].includes(' ')) {
        const err = {
          code: 422,
          reason: 'ValidationError',
          message: 'Must not contain whitespace',
          location: field
        }
        console.log(err)
        return err
      }
    }
  }
  return null
}

module.exports = {
  requiredFields,
  validateLengths,
  validateSpaceAround,
  validateSpaceInside
}
