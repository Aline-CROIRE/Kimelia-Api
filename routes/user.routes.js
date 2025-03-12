import express from "express"
import {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  addToFavorites,
  removeFromFavorites,
  getFavoriteProducts,
  getUserDashboard,
} from "../controllers/user.controller.js"
import { protect, admin } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Get all users (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: pageSize
 *         schema:
 *           type: integer
 *         description: Number of users per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or email
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 */
router.route("/").get(protect, admin, getUsers)

/**
 * @swagger
 * /api/users/dashboard:
 *   get:
 *     summary: Get user dashboard data
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User dashboard data
 *       401:
 *         description: Not authorized
 */
router.get("/dashboard", protect, getUserDashboard)

/**
 * @swagger
 * /api/users/favorites:
 *   get:
 *     summary: Get user's favorite products
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite products
 *       401:
 *         description: Not authorized
 *   post:
 *     summary: Add product to favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product added to favorites
 *       400:
 *         description: Product already in favorites
 *       401:
 *         description: Not authorized
 */
router.route("/favorites").get(protect, getFavoriteProducts).post(protect, addToFavorites)

/**
 * @swagger
 * /api/users/favorites/{productId}:
 *   delete:
 *     summary: Remove product from favorites
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         schema:
 *           type: string
 *         required: true
 *         description: ID of the product to remove
 *     responses:
 *       200:
 *         description: Product removed from favorites
 *       401:
 *         description: Not authorized
 */
router.delete("/favorites/:productId", protect, removeFromFavorites)

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Get user by ID (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User details
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 *       404:
 *         description: User not found
 *   put:
 *     summary: Update user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 *       404:
 *         description: User not found
 *   delete:
 *     summary: Delete user (admin only)
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: User ID
 *     responses:
 *       200:
 *         description: User removed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as an admin
 *       404:
 *         description: User not found
 */
router.route("/:id").get(protect, admin, getUserById).put(protect, admin, updateUser).delete(protect, admin, deleteUser)

export default router

