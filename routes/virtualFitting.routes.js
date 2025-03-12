import express from "express"
import {
  uploadUserPhoto,
  getVirtualFittingProfile,
  tryOnProduct,
  getTryOnHistory,
  deleteTryOnEntry,
} from "../controllers/VirtualFitting.controller.js"
import { protect } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/virtual-fitting/upload:
 *   post:
 *     summary: Upload user photo for virtual fitting
 *     tags: [Virtual Fitting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userImage:
 *                 type: string
 *               measurements:
 *                 type: object
 *     responses:
 *       201:
 *         description: User photo uploaded
 *       400:
 *         description: User image is required
 *       401:
 *         description: Not authorized
 */
router.post("/upload", protect, uploadUserPhoto)

/**
 * @swagger
 * /api/virtual-fitting/profile:
 *   get:
 *     summary: Get user's virtual fitting profile
 *     tags: [Virtual Fitting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Virtual fitting profile not found
 */
router.get("/profile", protect, getVirtualFittingProfile)

/**
 * @swagger
 * /api/virtual-fitting/try-on:
 *   post:
 *     summary: Try on a product virtually
 *     tags: [Virtual Fitting]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               customDesignId:
 *                 type: string
 *               size:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       200:
 *         description: Virtual try-on result
 *       400:
 *         description: Product ID or Custom Design ID is required
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Virtual fitting profile not found
 */
router.post("/try-on", protect, tryOnProduct)

/**
 * @swagger
 * /api/virtual-fitting/history:
 *   get:
 *     summary: Get try-on history
 *     tags: [Virtual Fitting]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Try-on history
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Virtual fitting profile not found
 */
router.get("/history", protect, getTryOnHistory)

/**
 * @swagger
 * /api/virtual-fitting/history/{entryId}:
 *   delete:
 *     summary: Delete try-on entry
 *     tags: [Virtual Fitting]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: entryId
 *         schema:
 *           type: string
 *         required: true
 *         description: Entry ID
 *     responses:
 *       200:
 *         description: Try-on entry deleted successfully
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Virtual fitting profile not found
 */
router.delete("/history/:entryId", protect, deleteTryOnEntry)

export default router

