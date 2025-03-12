import express from "express"
import { getUsers } from "../controllers/user.controller.js"
import User from "../models/user.model.js" // Import User model
import Product from "../models/product.model.js" // Import Product model

const router = express.Router()

/**
 * @swagger
 * /api/designers:
 *   get:
 *     summary: Get all designers
 *     tags: [Designers]
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of designers per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name
 *     responses:
 *       200:
 *         description: List of designers
 */
router.get(
  "/",
  (req, res, next) => {
    // Add role filter to get only designers
    req.query.role = "designer"
    next()
  },
  getUsers,
)

/**
 * @swagger
 * /api/designers/featured:
 *   get:
 *     summary: Get featured designers
 *     tags: [Designers]
 *     responses:
 *       200:
 *         description: List of featured designers
 */
router.get("/featured", async (req, res) => {
  try {
    // This is a placeholder for getting featured designers
    // In a real implementation, you might have a "featured" flag on users
    // or determine featured designers by their product ratings or sales

    const featuredDesigners = await User.find({ role: "designer" }).select("-password").limit(5)

    res.json(featuredDesigners)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

/**
 * @swagger
 * /api/designers/{id}/products:
 *   get:
 *     summary: Get products by designer
 *     tags: [Designers]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Designer ID
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of products per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of products by designer
 *       404:
 *         description: Designer not found
 */
router.get("/:id/products", async (req, res) => {
  try {
    const { id } = req.params
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Check if designer exists
    const designer = await User.findOne({ _id: id, role: "designer" })
    if (!designer) {
      return res.status(404).json({ message: "Designer not found" })
    }

    const count = await Product.countDocuments({ designer: id, isActive: true })

    const products = await Product.find({ designer: id, isActive: true })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
})

export default router

