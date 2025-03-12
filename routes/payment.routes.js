import express from "express"
import { processPayment, verifyPayment, paymentWebhook, getPaymentMethods } from "../controllers/payment.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/payments/process:
 *   post:
 *     summary: Process payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *               - paymentMethod
 *             properties:
 *               orderId:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *                 enum: [creditCard, paypal, momo]
 *               paymentDetails:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment processed
 *       400:
 *         description: Order ID is required or payment already processed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to process payment for this order
 *       404:
 *         description: Order not found
 */
router.post("/process", protect, processPayment)

/**
 * @swagger
 * /api/payments/verify/{transactionId}:
 *   get:
 *     summary: Verify payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: transactionId
 *         schema:
 *           type: string
 *         required: true
 *         description: Transaction ID
 *     responses:
 *       200:
 *         description: Payment verification result
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to verify this payment
 *       404:
 *         description: No order found with this transaction ID
 */
router.get("/verify/:transactionId", protect, verifyPayment)

/**
 * @swagger
 * /api/payments/webhook:
 *   post:
 *     summary: Payment webhook (for payment provider callbacks)
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - transactionId
 *               - status
 *             properties:
 *               transactionId:
 *                 type: string
 *               status:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *     responses:
 *       200:
 *         description: Webhook received
 *       400:
 *         description: Transaction ID is required
 *       404:
 *         description: No order found with this transaction ID
 */
router.post("/webhook", paymentWebhook)

/**
 * @swagger
 * /api/payments/methods:
 *   get:
 *     summary: Get payment methods
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of payment methods
 *       401:
 *         description: Not authorized
 */
router.get("/methods", protect, getPaymentMethods)

export default router

