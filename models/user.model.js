import mongoose from "mongoose"
import bcrypt from "bcryptjs"

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - email
 *         - password
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         firstName:
 *           type: string
 *           description: User's first name
 *         lastName:
 *           type: string
 *           description: User's last name
 *         email:
 *           type: string
 *           description: User's email address
 *         password:
 *           type: string
 *           description: User's password (hashed)
 *         profileImage:
 *           type: string
 *           description: URL to user's profile image
 *         role:
 *           type: string
 *           enum: [user, designer, admin]
 *           description: User's role in the system
 *         phoneNumber:
 *           type: string
 *           description: User's phone number
 *         address:
 *           type: object
 *           properties:
 *             street:
 *               type: string
 *             city:
 *               type: string
 *             state:
 *               type: string
 *             country:
 *               type: string
 *             postalCode:
 *               type: string
 *         bodyMeasurements:
 *           type: object
 *           description: User's body measurements for virtual fitting
 *         savedDesigns:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of saved custom design IDs
 *         favoriteProducts:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of favorite product IDs
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const userSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    profileImage: {
      type: String,
      default: "",
    },
    role: {
      type: String,
      enum: ["customer", "designer","seller" ,"admin"],
      default: "customer",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
    },
    bodyMeasurements: {
      height: Number,
      weight: Number,
      bust: Number,
      waist: Number,
      hips: Number,
      inseam: Number,
      shoulderWidth: Number,
      armLength: Number,
      // Additional measurements can be added as needed
    },
    savedDesigns: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "CustomDesign",
      },
    ],
    favoriteProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
  },
  {
    timestamps: true,
  },
)

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()

  try {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Method to compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

const User = mongoose.model("User", userSchema)

export default User

