import Order from "../models/order.model.js"

/**
 * @desc    Process payment
 * @route   POST /api/payments/process
 * @access  Private
 */
export const processPayment = async (req, res) => {
  try {
    const { orderId, paymentMethod, paymentDetails } = req.body

    if (!orderId) {
      return res.status(400).json({ message: "Order ID is required" })
    }

    const order = await Order.findById(orderId)

    if (!order) {
      return res.status(404).json({ message: "Order not found" })
    }

    // Check if the user is authorized to process payment for this order
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to process payment for this order" })
    }

    // Check if order is already paid
    if (order.paymentDetails && order.paymentDetails.status === "completed") {
      return res.status(400).json({ message: "Payment has already been processed for this order" })
    }

    // Process payment based on payment method
    let paymentResult

    switch (paymentMethod) {
      case "creditCard":
        paymentResult = await processCreditCardPayment(order, paymentDetails)
        break
      case "paypal":
        paymentResult = await processPayPalPayment(order, paymentDetails)
        break
      case "momo":
        paymentResult = await processMoMoPayment(order, paymentDetails)
        break
      default:
        return res.status(400).json({ message: "Invalid payment method" })
    }

    // Update order with payment result
    order.paymentMethod = paymentMethod
    order.paymentDetails = {
      transactionId: paymentResult.transactionId,
      status: paymentResult.status,
      date: new Date(),
    }

    // Update order status if payment is successful
    if (paymentResult.status === "completed") {
      order.status = "processing"
    }

    await order.save()

    res.json({
      success: true,
      paymentResult,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
        status: order.status,
        paymentDetails: order.paymentDetails,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Verify payment
 * @route   GET /api/payments/verify/:transactionId
 * @access  Private
 */
export const verifyPayment = async (req, res) => {
  try {
    const { transactionId } = req.params

    // Find order with this transaction ID
    const order = await Order.findOne({ "paymentDetails.transactionId": transactionId })

    if (!order) {
      return res.status(404).json({ message: "No order found with this transaction ID" })
    }

    // Check if the user is authorized to verify this payment
    if (order.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to verify this payment" })
    }

    // In a real implementation, this would verify the payment status with the payment provider
    const verificationResult = {
      verified: true,
      status: order.paymentDetails.status,
      date: order.paymentDetails.date,
    }

    res.json({
      success: true,
      verification: verificationResult,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Payment webhook (for payment provider callbacks)
 * @route   POST /api/payments/webhook
 * @access  Public
 */
export const paymentWebhook = async (req, res) => {
  try {
    const { transactionId, status, paymentMethod } = req.body

    // Validate webhook signature (in a real implementation)
    // const isValid = validateWebhookSignature(req);
    // if (!isValid) {
    //   return res.status(401).json({ message: 'Invalid webhook signature' });
    // }

    if (!transactionId) {
      return res.status(400).json({ message: "Transaction ID is required" })
    }

    // Find order with this transaction ID
    const order = await Order.findOne({ "paymentDetails.transactionId": transactionId })

    if (!order) {
      return res.status(404).json({ message: "No order found with this transaction ID" })
    }

    // Update payment status
    order.paymentDetails.status = status

    // Update order status based on payment status
    if (status === "completed") {
      order.status = "processing"
    } else if (status === "failed") {
      order.status = "pending"
    }

    await order.save()

    res.status(200).json({ received: true })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get payment methods
 * @route   GET /api/payments/methods
 * @access  Private
 */
export const getPaymentMethods = async (req, res) => {
  try {
    // In a real implementation, this might fetch from a database or payment provider
    const paymentMethods = [
      {
        id: "creditCard",
        name: "Credit Card",
        description: "Pay with Visa, Mastercard, or American Express",
        icon: "credit-card",
        enabled: true,
      },
      {
        id: "paypal",
        name: "PayPal",
        description: "Pay with your PayPal account",
        icon: "paypal",
        enabled: true,
      },
      {
        id: "momo",
        name: "Mobile Money",
        description: "Pay with Mobile Money",
        icon: "smartphone",
        enabled: true,
      },
    ]

    res.json({
      success: true,
      paymentMethods,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper functions for payment processing
const processCreditCardPayment = async (order, paymentDetails) => {
  // In a real implementation, this would integrate with a payment gateway
  // For now, we'll simulate a successful payment

  // Validate credit card details
  if (!paymentDetails.cardNumber || !paymentDetails.expiryDate || !paymentDetails.cvv) {
    throw new Error("Invalid credit card details")
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    transactionId: `cc_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: "completed",
    message: "Payment processed successfully",
  }
}

const processPayPalPayment = async (order, paymentDetails) => {
  // In a real implementation, this would integrate with PayPal API
  // For now, we'll simulate a successful payment

  // Validate PayPal details
  if (!paymentDetails.paypalEmail) {
    throw new Error("PayPal email is required")
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    transactionId: `pp_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: "completed",
    message: "PayPal payment processed successfully",
  }
}

const processMoMoPayment = async (order, paymentDetails) => {
  // In a real implementation, this would integrate with Mobile Money API
  // For now, we'll simulate a successful payment

  // Validate Mobile Money details
  if (!paymentDetails.phoneNumber) {
    throw new Error("Phone number is required")
  }

  // Simulate processing delay
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return {
    transactionId: `mm_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    status: "completed",
    message: "Mobile Money payment processed successfully",
  }
}

