import Order from "../models/order.model.js"
import Product from "../models/product.model.js"
import CustomDesign from "../models/customDesign.model.js"

/**
 * @desc    Create new order
 * @route   POST /api/orders
 * @access  Private
 */
export const createOrder = async (req, res) => {
  try {
    const {
      items,
      shippingAddress,
      billingAddress,
      paymentMethod,
      paymentDetails,
      subtotal,
      shippingCost,
      tax,
      discount,
      totalAmount,
      notes,
    } = req.body

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No order items" })
    }

    // Validate items and calculate total
    let calculatedSubtotal = 0
    for (const item of items) {
      if (item.product) {
        const product = await Product.findById(item.product)
        if (!product) {
          return res.status(404).json({ message: `Product not found: ${item.product}` })
        }

        // Check if size is available
        if (item.size) {
          const sizeObj = product.sizes.find((s) => s.size === item.size)
          if (!sizeObj || sizeObj.quantity < item.quantity) {
            return res.status(400).json({
              message: `Not enough stock for ${product.name} in size ${item.size}`,
            })
          }
        }

        calculatedSubtotal += product.price * item.quantity
      } else if (item.customDesign) {
        const customDesign = await CustomDesign.findById(item.customDesign)
        if (!customDesign) {
          return res.status(404).json({ message: `Custom design not found: ${item.customDesign}` })
        }

        if (customDesign.status !== "approved") {
          return res.status(400).json({
            message: `Custom design ${customDesign.name} is not approved for ordering`,
          })
        }

        calculatedSubtotal += customDesign.estimatedPrice * item.quantity
      } else {
        return res.status(400).json({ message: "Each item must have either product or customDesign" })
      }
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items,
      shippingAddress,
      billingAddress: billingAddress || shippingAddress,
      paymentMethod,
      paymentDetails,
      subtotal: subtotal || calculatedSubtotal,
      shippingCost: shippingCost || 0,
      tax: tax || 0,
      discount: discount || 0,
      totalAmount: totalAmount || calculatedSubtotal + (shippingCost || 0) + (tax || 0) - (discount || 0),
      notes,
    })

    const createdOrder = await order.save()

    // Update product inventory
    for (const item of items) {
      if (item.product && item.size) {
        const product = await Product.findById(item.product)
        const sizeIndex = product.sizes.findIndex((s) => s.size === item.size)

        if (sizeIndex !== -1) {
          product.sizes[sizeIndex].quantity -= item.quantity
          await product.save()
        }
      }
    }

    res.status(201).json(createdOrder)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get order by ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
export const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate("user", "firstName lastName email")
      .populate({
        path: "items.product",
        select: "name images price",
      })
      .populate({
        path: "items.customDesign",
        select: "name designImages estimatedPrice",
      })

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if the user is authorized to view this order
    if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" })
    }

    res.json(order)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get logged in user orders
 * @route   GET /api/orders/myorders
 * @access  Private
 */
export const getMyOrders = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    const count = await Order.countDocuments({ user: req.user._id })

    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Update order status
 * @route   PUT /api/orders/:id/status
 * @access  Private/Admin
 */
export const updateOrderStatus = async (req, res) => {
  try {
    const { status, trackingInfo } = req.body

    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    order.status = status || order.status

    if (trackingInfo) {
      order.trackingInfo = {
        ...order.trackingInfo,
        ...trackingInfo,
      }
    }

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Update order payment details
 * @route   PUT /api/orders/:id/pay
 * @access  Private
 */
export const updateOrderPayment = async (req, res) => {
  try {
    const { paymentDetails } = req.body

    const order = await Order.findById(req.params.id)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if the user is authorized to update this order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this order" })
    }

    order.paymentDetails = paymentDetails
    order.status = "processing" // Update status after payment

    const updatedOrder = await order.save()
    res.json(updatedOrder)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get all orders
 * @route   GET /api/orders
 * @access  Private/Admin
 */
export const getOrders = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Build filter object based on query parameters
    const filter = {}

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.user) {
      filter.user = req.query.user
    }

    if (req.query.startDate && req.query.endDate) {
      filter.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate),
      }
    }

    const count = await Order.countDocuments(filter)

    const orders = await Order.find(filter)
      .populate("user", "firstName lastName email")
      .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.order === "desc" ? -1 : 1 } : { createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      orders,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

