import User from "../models/user.model.js"
import Order from "../models/order.model.js"
import CustomDesign from "../models/customDesign.model.js"

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
export const getUsers = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Build filter object based on query parameters
    const filter = {}

    if (req.query.role) {
      filter.role = req.query.role
    }

    if (req.query.search) {
      filter.$or = [
        { firstName: { $regex: req.query.search, $options: "i" } },
        { lastName: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ]
    }

    const count = await User.countDocuments(filter)

    const users = await User.find(filter)
      .select("-password")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      users,
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
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private/Admin
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password")

    if (user) {
      res.json(user)
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private/Admin
 */
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (user) {
      user.firstName = req.body.firstName || user.firstName
      user.lastName = req.body.lastName || user.lastName
      user.email = req.body.email || user.email
      user.role = req.body.role || user.role

      const updatedUser = await user.save()

      res.json({
        _id: updatedUser._id,
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        email: updatedUser.email,
        role: updatedUser.role,
      })
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
   error: error.message });
  }
};

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (user) {
      await user.deleteOne()
      res.json({ message: "User removed" })
    } else {
      res.status(404).json({ message: "User not found" })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Add product to favorites
 * @route   POST /api/users/favorites
 * @access  Private
 */
export const addToFavorites = async (req, res) => {
  try {
    const { productId } = req.body

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" })
    }

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    // Check if product is already in favorites
    if (user.favoriteProducts.includes(productId)) {
      return res.status(400).json({ message: "Product already in favorites" })
    }

    user.favoriteProducts.push(productId)
    await user.save()

    res.json({
      success: true,
      message: "Product added to favorites",
      favoriteProducts: user.favoriteProducts,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Remove product from favorites
 * @route   DELETE /api/users/favorites/:productId
 * @access  Private
 */
export const removeFromFavorites = async (req, res) => {
  try {
    const { productId } = req.params

    const user = await User.findById(req.user._id)

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    user.favoriteProducts = user.favoriteProducts.filter((id) => id.toString() !== productId)

    await user.save()

    res.json({
      success: true,
      message: "Product removed from favorites",
      favoriteProducts: user.favoriteProducts,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get user's favorite products
 * @route   GET /api/users/favorites
 * @access  Private
 */
export const getFavoriteProducts = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("favoriteProducts")

    if (!user) {
      return res.status(404).json({ message: "User not found" })
    }

    res.json({
      success: true,
      favorites: user.favoriteProducts,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get user dashboard data
 * @route   GET /api/users/dashboard
 * @access  Private
 */
export const getUserDashboard = async (req, res) => {
  try {
    // Get recent orders
    const recentOrders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("items.product", "name images")

    // Get custom designs
    const customDesigns = await CustomDesign.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(5)

    // Get user data
    const user = await User.findById(req.user._id).select("-password").populate("favoriteProducts", "name images price")

    res.json({
      success: true,
      dashboard: {
        user,
        recentOrders,
        customDesigns,
        favoriteProducts: user.favoriteProducts,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

