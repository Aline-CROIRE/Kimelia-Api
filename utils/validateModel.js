import mongoose from "mongoose"

/**
 * Validate MongoDB ObjectId
 * @param {string} id - MongoDB ObjectId to validate
 * @returns {boolean} True if valid, false otherwise
 */
const validateMongoId = (id) => {
  return mongoose.Types.ObjectId.isValid(id)
}

export default validateMongoId

