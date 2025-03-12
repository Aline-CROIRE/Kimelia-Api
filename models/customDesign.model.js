import mongoose from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     CustomDesign:
 *       type: object
 *       required:
 *         - name
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Design name
 *         user:
 *           type: string
 *           description: Reference to the user who created the design
 *         baseProduct:
 *           type: string
 *           description: Reference to a base product (if customizing existing product)
 *         designType:
 *           type: string
 *           enum: [fromScratch, customization]
 *           description: Whether design is from scratch or customization of existing product
 *         category:
 *           type: string
 *           enum: [dresses, tops, bottoms, outerwear, accessories, footwear, other]
 *         description:
 *           type: string
 *         designElements:
 *           type: object
 *           properties:
 *             fabric:
 *               type: object
 *             color:
 *               type: object
 *             pattern:
 *               type: object
 *             style:
 *               type: object
 *             measurements:
 *               type: object
 *         designImages:
 *           type: array
 *           items:
 *             type: string
 *           description: URLs to design images or 3D renders
 *         designData:
 *           type: object
 *           description: JSON data for 3D model or design specifications
 *         estimatedPrice:
 *           type: number
 *         status:
 *           type: string
 *           enum: [draft, submitted, approved, inProduction, completed, rejected]
 *         designerNotes:
 *           type: string
 *           description: Notes from designer about the custom design
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const customDesignSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    baseProduct: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    designType: {
      type: String,
      enum: ["fromScratch", "customization"],
      default: "fromScratch",
    },
    category: {
      type: String,
      enum: ["dresses", "tops", "bottoms", "outerwear", "accessories", "footwear", "other"],
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
    designElements: {
      fabric: {
        type: {
          name: String,
          image: String,
          cost: Number,
        },
      },
      color: {
        name: String,
        hexCode: String,
      },
      pattern: {
        name: String,
        image: String,
      },
      style: {
        name: String,
        details: Object,
      },
      measurements: {
        // Custom measurements for the design
        bust: Number,
        waist: Number,
        hips: Number,
        length: Number,
        // Additional measurements as needed
      },
    },
    designImages: [
      {
        type: String,
      },
    ],
    designData: {
      // JSON data for 3D model or design specifications
      type: Object,
    },
    estimatedPrice: {
      type: Number,
      min: 0,
    },
    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "inProduction", "completed", "rejected"],
      default: "draft",
    },
    designerNotes: {
      type: String,
    },
    assignedDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  },
)

const CustomDesign = mongoose.model("CustomDesign", customDesignSchema)

export default CustomDesign

