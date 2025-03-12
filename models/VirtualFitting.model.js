import mongoose from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     VirtualFitting:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         user:
 *           type: string
 *           description: Reference to the user
 *         userImage:
 *           type: string
 *           description: URL to user's uploaded image for virtual fitting
 *         bodyModel:
 *           type: object
 *           description: 3D body model data
 *         fittedProducts:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *               customDesign:
 *                 type: string
 *               fittingResult:
 *                 type: object
 *               fittingImage:
 *                 type: string
 *               fittingNotes:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *           description: Products that have been virtually fitted
 *         measurements:
 *           type: object
 *           description: User's body measurements
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const virtualFittingSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    userImage: {
      type: String,
    },
    bodyModel: {
      // 3D body model data
      type: Object,
    },
    fittedProducts: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        customDesign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CustomDesign",
        },
        fittingResult: {
          fit: {
            type: String,
            enum: ["perfect", "loose", "tight", "needsAlteration"],
          },
          sizeRecommendation: String,
          fitScore: Number, // 0-100 score indicating how well the item fits
          fitDetails: {
            // Detailed fit information for different body parts
            shoulders: String,
            bust: String,
            waist: String,
            hips: String,
            length: String,
            // Additional fit details
          },
        },
        fittingImage: String, // URL to the rendered image of the product on the user
        fittingNotes: String,
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    measurements: {
      // User's body measurements
      height: Number,
      weight: Number,
      bust: Number,
      waist: Number,
      hips: Number,
      inseam: Number,
      shoulderWidth: Number,
      armLength: Number,
      // Additional measurements
    },
  },
  {
    timestamps: true,
  },
)

const VirtualFitting = mongoose.model("VirtualFitting", virtualFittingSchema)

export default VirtualFitting

