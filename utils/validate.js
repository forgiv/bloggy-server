/**
 * Checks body for keys in fields
 * @param {Object} body
 * @param {string[]} fields
 * @returns {Object|null} Error object if err, else null
 */
const requiredFields = (body, fields) => {
  for (const field of fields) {
    if (!body[field]) {
      const err = new Error(`Missing ${field} in request body`)
      err.status = 400
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
    return {
      code: 422,
      reason: 'ValidationError',
      message: tooSmallField
        ? `Must be at least ${sizedFields[tooSmallField].min} characters long`
        : `Must be at most ${sizedFields[tooLargeField].max} characters long`,
      location: tooSmallField || tooLargeField
    }
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
    if (body[field].length === body[field].trim().length) {
      return {
        code: 422,
        reason: 'ValidationError',
        message: 'Must not have leading, or trailing, whitespace',
        location: field
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
    if (body[field].includes(' ')) {
      return {
        code: 422,
        reason: 'ValidationError',
        message: 'Must not contain whitespace',
        location: field
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
