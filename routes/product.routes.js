import express from "express"
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  createProductReview,
  getTopProducts,
  getSellerProducts,
  getSellerStats,
  deleteProductImage,
  bulkUpdateProductStatus
} from "../controllers/product.controller.js"
import { protect, designer, seller, admin } from "../middlewares/auth.middleware.js"

const router = express.Router()

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: designer
 *         schema:
 *           type: string
 *         description: Filter by designer ID
 *       - in: query
 *         name: seller
 *         schema:
 *           type: string
 *         description: Filter by seller ID
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Filter by tags (comma-separated)
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of products
 *   post:
 *     summary: Create a product (designer, seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               sizes:
 *                 type: string
 *                 description: Comma-separated sizes
 *               colors:
 *                 type: string
 *                 description: Comma-separated colors
 *               materials:
 *                 type: string
 *                 description: Comma-separated materials
 *               isCustomizable:
 *                 type: boolean
 *               customizationOptions:
 *                 type: string
 *               designerId:
 *                 type: string
 *                 description: Optional designer ID if different from seller
 *     responses:
 *       201:
 *         description: Product created
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as a designer, seller, or admin
 */
// Allow both designers and sellers to create products
router.route("/").get(getProducts).post(protect, createProduct)

/**
 * @swagger
 * /api/products/top:
 *   get:
 *     summary: Get top rated products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of top rated products
 */
router.get("/top", getTopProducts)

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Get product by ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product details
 *       404:
 *         description: Product not found
 *   put:
 *     summary: Update a product (designer, seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               image:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *               tags:
 *                 type: string
 *                 description: Comma-separated tags
 *               sizes:
 *                 type: string
 *                 description: Comma-separated sizes
 *               colors:
 *                 type: string
 *                 description: Comma-separated colors
 *               materials:
 *                 type: string
 *                 description: Comma-separated materials
 *               isCustomizable:
 *                 type: boolean
 *               customizationOptions:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Product updated
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 *   delete:
 *     summary: Delete a product (designer, seller, admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     responses:
 *       200:
 *         description: Product removed
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to delete this product
 *       404:
 *         description: Product not found
 */
router.route("/:id").get(getProductById).put(protect, updateProduct).delete(protect, deleteProduct)

/**
 * @swagger
 * /api/products/{id}/reviews:
 *   post:
 *     summary: Create a product review
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 5
 *               review:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 *       400:
 *         description: Product already reviewed
 *       401:
 *         description: Not authorized
 *       404:
 *         description: Product not found
 */
router.route("/:id/reviews").post(protect, createProductReview)

/**
 * @swagger
 * /api/products/{id}/images/{imageIndex}:
 *   delete:
 *     summary: Delete a product image
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: Product ID
 *       - in: path
 *         name: imageIndex
 *         schema:
 *           type: integer
 *         required: true
 *         description: Index of the image to delete
 *     responses:
 *       200:
 *         description: Image removed
 *       400:
 *         description: Invalid image index
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized to update this product
 *       404:
 *         description: Product not found
 */
router.route("/:id/images/:imageIndex").delete(protect, deleteProductImage)

// Create a separate router for seller-specific endpoints
const sellerRouter = express.Router()

/**
 * @swagger
 * /api/sellers/products:
 *   get:
 *     summary: Get products for the authenticated seller
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name or description
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, inactive]
 *         description: Filter by product status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field
 *       - in: query
 *         name: order
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *         description: Sort order
 *     responses:
 *       200:
 *         description: List of seller's products
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as a seller
 */
sellerRouter.route("/products").get(protect, seller, getSellerProducts)

/**
 * @swagger
 * /api/sellers/stats:
 *   get:
 *     summary: Get dashboard stats for the authenticated seller
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller statistics
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as a seller
 */
sellerRouter.route("/stats").get(protect, seller, getSellerStats)

/**
 * @swagger
 * /api/sellers/products/bulk-status:
 *   put:
 *     summary: Bulk update product status
 *     tags: [Sellers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productIds
 *               - isActive
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of product IDs to update
 *               isActive:
 *                 type: boolean
 *                 description: New status for the products
 *     responses:
 *       200:
 *         description: Products updated
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Not authorized
 *       403:
 *         description: Not authorized as a seller
 *       404:
 *         description: No matching products found
 */
sellerRouter.route("/products/bulk-status").put(protect, seller, bulkUpdateProductStatus)

export { router as productRouter, sellerRouter }

// For backward compatibility
export default router
