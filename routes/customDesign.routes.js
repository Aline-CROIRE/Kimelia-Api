import express from "express"
import {
  createCustomDesign,
  getUserCustomDesigns,
  getCustomDesignById,
  updateCustomDesign,
  deleteCustomDesign,
  submitCustomDesign,
  assignDesigner,
  updateDesignStatus,
  getAllCustomDesigns,
} from "../controllers/customDesign.controller.js"
import { protect, admin, designer } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/custom-designs:
 *   post:
 *     summary: Create a new custom design
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               baseProduct:
 *                 type: string
 *               designType:
 *                 type: string
 *                 enum: [fromScratch, customization]
 *               category:
 *                 type: string
 *               description:
 *                 type: string
 *               designElements:
 *                 type: object
 *               designImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               designData:
 *                 type: object
 *               estimatedPrice:
 *                 type: number
 *     responses:
 *       201:
 *         description: Custom design created
 *       401:
 *         description: Not authorized
 *   get:
 *     summary: Get all custom designs for a user
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of designs per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: designType
 *         schema:
 *           type: string
 *         description: Filter by design type
 *     responses:
 *       200:
 *         description: List of custom designs
 *       401:
 *         description: Not authorized
 */
router.route("/").post(protect, createCustomDesign).get(protect, getUserCustomDesigns)

/**
 * @swagger
 * /api/custom-designs/all:
 *   get:
 *     summary: Get all custom designs (admin/designer)
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of designs per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID
 *     responses:
 *       200:
 *         description: List of all custom designs
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as a designer or admin
 */
router.get("/all", protect, designer, getAllCustomDesigns)

/**
 * @swagger
 * /api/custom-designs/{id}:
 *   get:
 *     summary: Get custom design by ID
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     responses:
 *       200:
 *         description: Custom design details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to view this design
 *       404:
 *         description: Custom design not found
 *   put:
 *     summary: Update custom design
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               designElements:
 *                 type: object
 *               designImages:
 *                 type: array
 *                 items:
 *                   type: string
 *               designData:
 *                 type: object
 *     responses:
 *       200:
 *         description: Custom design updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this design
 *       404:
 *         description: Custom design not found
 *   delete:
 *     summary: Delete custom design
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     responses:
 *       200:
 *         description: Custom design removed
 *       400:
 *         description: Cannot delete a design that has been submitted
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to delete this design
 *       404:
 *         description: Custom design not found
 */
router
  .route("/:id")
  .get(protect, getCustomDesignById)
  .put(protect, updateCustomDesign)
  .delete(protect, deleteCustomDesign)

/**
 * @swagger
 * /api/custom-designs/{id}/submit:
 *   put:
 *     summary: Submit custom design for review
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     responses:
 *       200:
 *         description: Custom design submitted
 *       400:
 *         description: Design has already been submitted
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to submit this design
 *       404:
 *         description: Custom design not found
 */
router.put("/:id/submit", protect, submitCustomDesign)

/**
 * @swagger
 * /api/custom-designs/{id}/assign:
 *   put:
 *     summary: Assign designer to custom design (admin only)
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - designerId
 *             properties:
 *               designerId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Designer assigned
 *       400:
 *         description: Invalid designer
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 *       404:
 *         description: Custom design not found
 */
router.put("/:id/assign", protect, admin, assignDesigner)

/**
 * @swagger
 * /api/custom-designs/{id}/status:
 *   put:
 *     summary: Update custom design status (designer only)
 *     tags: [Custom Designs]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Custom design ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, submitted, approved, inProduction, completed, rejected]
 *               designerNotes:
 *                 type: string
 *               estimatedPrice:
 *                 type: number
 *     responses:
 *       200:
 *         description: Custom design status updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this design status
 *       404:
 *         description: Custom design not found
 */
router.put("/:id/status", protect, designer, updateDesignStatus)

export default router

