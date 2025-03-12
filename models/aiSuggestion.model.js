import mongoose from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     AISuggestion:
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
 *         preferences:
 *           type: object
 *           properties:
 *             style:
 *               type: array
 *               items:
 *                 type: string
 *             colors:
 *               type: array
 *               items:
 *                 type: string
 *             occasions:
 *               type: array
 *               items:
 *                 type: string
 *             seasonalPreferences:
 *               type: array
 *               items:
 *                 type: string
 *           description: User's style preferences
 *         suggestedOutfits:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               outfitName:
 *                 type: string
 *               products:
 *                 type: array
 *                 items:
 *                   type: string
 *               occasion:
 *                 type: string
 *               season:
 *                 type: string
 *               outfitImage:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *           description: AI-suggested outfits
 *         userFeedback:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               outfitId:
 *                 type: string
 *               liked:
 *                 type: boolean
 *               feedback:
 *                 type: string
 *               createdAt:
 *                 type: string
 *                 format: date-time
 *           description: User feedback on suggestions
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const aiSuggestionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    preferences: {
      style: [String], // e.g., 'casual', 'formal', 'bohemian', 'minimalist'
      colors: [String], // preferred colors
      occasions: [String], // e.g., 'work', 'party', 'casual', 'formal'
      seasonalPreferences: [String], // e.g., 'summer', 'winter', 'spring', 'fall'
      avoidedItems: [String], // items the user prefers to avoid
      favoriteItems: [String], // items the user particularly likes
    },
    suggestedOutfits: [
      {
        outfitName: String,
        products: [
          {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
          },
        ],
        occasion: String,
        season: String,
        outfitImage: String, // URL to a generated image of the outfit
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    userFeedback: [
      {
        outfitId: String, // Reference to a specific outfit in suggestedOutfits
        liked: Boolean,
        feedback: String, // User's text feedback
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  },
)

const AISuggestion = mongoose.model("AISuggestion", aiSuggestionSchema)

export default AISuggestion

