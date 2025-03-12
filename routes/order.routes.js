import express from "express"
import {
  createOrder,
  getOrderById,
  getMyOrders,
  updateOrderStatus,
  updateOrderPayment,
  getOrders,
} from "../controllers/order.controller.js"
import { protect, admin } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - shippingAddress
 *               - paymentMethod
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                     customDesign:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     price:
 *                       type: number
 *                     size:
 *                       type: string
 *                     color:
 *                       type: string
 *                     customizations:
 *                       type: object
 *               shippingAddress:
 *                 type: object
 *               billingAddress:
 *                 type: object
 *               paymentMethod:
 *                 type: string
 *               paymentDetails:
 *                 type: object
 *               subtotal:
 *                 type: number
 *               shippingCost:
 *                 type: number
 *               tax:
 *                 type: number
 *               discount:
 *                 type: number
 *               totalAmount:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: No order items or invalid data
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Get all orders (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of orders per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by order status
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for filtering
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for filtering
 *     responses:
 *       200:
 *         description: List of orders
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 */
router.route("/").post(protect, createOrder).get(protect, admin, getOrders)

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get logged in user orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of orders per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of user's orders
 *       401:
 *         description: Not authorized
 */
router.get("/myorders", protect, getMyOrders)

/**
 * @swagger
 * /api/orders/{id}:
 *   get:
 *     summary: Get order by ID
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     responses:
 *       200:
 *         description: Order details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to view this order
 *       404:
 *         description: Order not found
 */
router.get("/:id", protect, getOrderById)

/**
 * @swagger
 * /api/orders/{id}/status:
 *   put:
 *     summary: Update order status (admin only)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, processing, shipped, delivered, cancelled]
 *               trackingInfo:
 *                 type: object
 *                 properties:
 *                   carrier:
 *                     type: string
 *                   trackingNumber:
 *                     type: string
 *                   estimatedDelivery:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: Order status updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 *       404:
 *         description: Order not found
 */
router.put("/:id/status", protect, admin, updateOrderStatus)

/**
 * @swagger
 * /api/orders/{id}/pay:
 *   put:
 *     summary: Update order payment details
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - paymentDetails
 *             properties:
 *               paymentDetails:
 *                 type: object
 *                 properties:
 *                   transactionId:
 *                     type: string
 *                   status:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *     responses:
 *       200:
 *         description: Order payment updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this order
 *       404:
 *         description: Order not found
 */
router.put("/:id/pay", protect, updateOrderPayment)

export default router

