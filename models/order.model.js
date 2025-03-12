import mongoose from "mongoose"

/**
 * @swagger
 * components:
 *   schemas:
 *     Order:
 *       type: object
 *       required:
 *         - user
 *         - items
 *         - shippingAddress
 *         - totalAmount
 *       properties:
 *         _id:
 *           type: string
 *           description: Auto-generated ID
 *         orderNumber:
 *           type: string
 *           description: Unique order number
 *         user:
 *           type: string
 *           description: Reference to the user who placed the order
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               product:
 *                 type: string
 *                 description: Reference to the product
 *               customDesign:
 *                 type: string
 *                 description: Reference to custom design (if applicable)
 *               quantity:
 *                 type: number
 *               price:
 *                 type: number
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *               customizations:
 *                 type: object
 *           description: Order items
 *         shippingAddress:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
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
 *             phoneNumber:
 *               type: string
 *         billingAddress:
 *           type: object
 *           properties:
 *             fullName:
 *               type: string
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
 *             phoneNumber:
 *               type: string
 *         paymentMethod:
 *           type: string
 *           enum: [creditCard, paypal, momo]
 *         paymentDetails:
 *           type: object
 *           description: Payment transaction details
 *         subtotal:
 *           type: number
 *         shippingCost:
 *           type: number
 *         tax:
 *           type: number
 *         discount:
 *           type: number
 *         totalAmount:
 *           type: number
 *         status:
 *           type: string
 *           enum: [pending, processing, shipped, delivered, cancelled]
 *         trackingInfo:
 *           type: object
 *           properties:
 *             carrier:
 *               type: string
 *             trackingNumber:
 *               type: string
 *             estimatedDelivery:
 *               type: string
 *               format: date-time
 *         notes:
 *           type: string
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
        customDesign: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "CustomDesign",
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        price: {
          type: Number,
          required: true,
        },
        size: String,
        color: String,
        customizations: {
          fabric: String,
          style: String,
          // Other customization options
        },
      },
    ],
    shippingAddress: {
      fullName: {
        type: String,
        required: true,
      },
      street: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      state: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      postalCode: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
    },
    billingAddress: {
      fullName: String,
      street: String,
      city: String,
      state: String,
      country: String,
      postalCode: String,
      phoneNumber: String,
    },
    paymentMethod: {
      type: String,
      enum: ["creditCard", "paypal", "momo"],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      status: String,
      date: Date,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    shippingCost: {
      type: Number,
      default: 0,
    },
    tax: {
      type: Number,
      default: 0,
    },
    discount: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    trackingInfo: {
      carrier: String,
      trackingNumber: String,
      estimatedDelivery: Date,
    },
    notes: String,
  },
  {
    timestamps: true,
  },
)

// Generate unique order number before saving
orderSchema.pre("save", async function (next) {
  if (!this.orderNumber) {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const day = date.getDate().toString().padStart(2, "0")
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0")
    this.orderNumber = `KL-${year}${month}${day}-${random}`
  }
  next()
})

const Order = mongoose.model("Order", orderSchema)

export default Order

