import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Product:
 *       type: object
 *       required:
 *         - name
 *         - price
 *         - designer
 *         - category
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         name:
 *           type: string
 *           description: Product name
 *         description:
 *           type: string
 *           description: Product description
 *         price:
 *           type: number
 *           description: Product price
 *         salePrice:
 *           type: number
 *           description: Sale price (if on sale)
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of product image URLs
 *         designer:
 *           type: string
 *           description: Reference to the designer/vendor
 *         category:
 *           type: string
 *           description: Product category
 *         tags:
 *           type: array
 *           items:
 *             type: string
 *           description: Product tags for filtering
 *         sizes:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               size:
 *                 type: string
 *               quantity:
 *                 type: number
 *           description: Available sizes and stock quantity
 *         colors:
 *           type: array
 *           items:
 *             type: string
 *           description: Available color names
 *         materials:
 *           type: array
 *           items:
 *             type: string
 *           description: Materials used in the product
 *         isCustomizable:
 *           type: boolean
 *           description: Whether the product can be customized
 *         customizationOptions:
 *           type: object
 *           description: Options for customization
 *         ratings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               user:
 *                 type: string
 *               rating:
 *                 type: number
 *               review:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date-time
 *           description: Product ratings and reviews
 *         averageRating:
 *           type: number
 *           description: Average product rating
 *         isActive:
 *           type: boolean
 *           description: Whether the product is active/available
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    salePrice: {
      type: Number,
      min: 0,
    },
    images: [
      {
        type: String,
        required: true,
      },
    ],
    designer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      required: true,
  
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    sizes: [
      {
        size: String,
        quantity: {
          type: Number,
          min: 0,
          default: 0,
        },
      },
    ],
    colors: [  // Modified Schema to array of strings
      {
        type: String,
      },
    ],
    materials: [
      {
        type: String,
      },
    ],
    isCustomizable: {
      type: Boolean,
      default: false,
    },
    customizationOptions: {
      fabrics: [
        {
          name: String,
          image: String,
          additionalCost: Number,
        },
      ],
      styles: [
        {
          name: String,
          image: String,
          additionalCost: Number,
        },
      ],
      // Other customization options
    },
    ratings: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        review: String,
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    averageRating: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
)

// Calculate average rating before saving
productSchema.pre("save", function (next) {
  if (this.ratings.length > 0) {
    const totalRating = this.ratings.reduce((sum, item) => sum + item.rating, 0)
    this.averageRating = totalRating / this.ratings.length
  }
  next()
})

const Product = mongoose.model("Product", productSchema)

export default Product
