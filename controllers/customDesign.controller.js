import CustomDesign from "../models/customDesign.model.js"
import User from "../models/user.model.js"

/**
 * @desc    Create a new custom design
 * @route   POST /api/custom-designs
 * @access  Private
 */
export const createCustomDesign = async (req, res) => {
  try {
    const {
      name,
      baseProduct,
      designType,
      category,
      description,
      designElements,
      designImages,
      designData,
      estimatedPrice,
    } = req.body

    const customDesign = new CustomDesign({
      name,
      user: req.user._id,
      baseProduct,
      designType,
      category,
      description,
      designElements,
      designImages,
      designData,
      estimatedPrice,
    })

    const createdDesign = await customDesign.save()

    // Add to user's saved designs
    await User.findByIdAndUpdate(req.user._id, { $push: { savedDesigns: createdDesign._id } })

    res.status(201).json(createdDesign)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get all custom designs for a user
 * @route   GET /api/custom-designs
 * @access  Private
 */
export const getUserCustomDesigns = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Build filter object based on query parameters
    const filter = { user: req.user._id }

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.designType) {
      filter.designType = req.query.designType
    }

    const count = await CustomDesign.countDocuments(filter)

    const designs = await CustomDesign.find(filter)
      .populate("baseProduct", "name images")
      .populate("assignedDesigner", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      designs,
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
 * @desc    Get custom design by ID
 * @route   GET /api/custom-designs/:id
 * @access  Private
 */
export const getCustomDesignById = async (req, res) => {
  try {
    const design = await CustomDesign.findById(req.params.id)
      .populate("baseProduct", "name images price category")
      .populate("assignedDesigner", "firstName lastName email")

    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    // Check if the user is authorized to view this design
    if (
      design.user.toString() !== req.user._id.toString() &&
      design.assignedDesigner?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to view this design" })
    }

    res.json(design)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Update custom design
 * @route   PUT /api/custom-designs/:id
 * @access  Private
 */
export const updateCustomDesign = async (req, res) => {
  try {
    const design = await CustomDesign.findById(req.params.id)

    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    // Check if the user is authorized to update this design
    if (
      design.user.toString() !== req.user._id.toString() &&
      design.assignedDesigner?.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "Not authorized to update this design" })
    }

    // If the design is already submitted, only designers or admins can update certain fields
    if (design.status !== "draft" && req.user.role !== "designer" && req.user.role !== "admin") {
      // Allow users to update only specific fields after submission
      const allowedFields = ["name", "description"]
      Object.keys(req.body).forEach((key) => {
        if (allowedFields.includes(key)) {
          design[key] = req.body[key]
        }
      })
    } else {
      // Update all fields
      Object.keys(req.body).forEach((key) => {
        design[key] = req.body[key]
      })
    }

    const updatedDesign = await design.save()
    res.json(updatedDesign)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Delete custom design
 * @route   DELETE /api/custom-designs/:id
 * @access  Private
 */
export const deleteCustomDesign = async (req, res) => {
  try {
    const design = await CustomDesign.findById(req.params.id)

    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    // Check if the user is authorized to delete this design
    if (design.user.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this design" })
    }

    // Only allow deletion if the design is in draft status
    if (design.status !== "draft") {
      return res.status(400).json({ message: "Cannot delete a design that has been submitted" })
    }

    await design.deleteOne()

    // Remove from user's saved designs
    await User.findByIdAndUpdate(req.user._id, { $pull: { savedDesigns: design._id } })

    res.json({ message: "Custom design removed" })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Submit custom design for review
 * @route   PUT /api/custom-designs/:id/submit
 * @access  Private
 */
export const submitCustomDesign = async (req, res) => {
  try {
    const design = await CustomDesign.findById(req.params.id)

    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    // Check if the user is authorized to submit this design
    if (design.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to submit this design" })
    }

    // Only allow submission if the design is in draft status
    if (design.status !== "draft") {
      return res.status(400).json({ message: "Design has already been submitted" })
    }

    design.status = "submitted"
    const updatedDesign = await design.save()

    res.json(updatedDesign)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Assign designer to custom design
 * @route   PUT /api/custom-designs/:id/assign
 * @access  Private/Admin
 */
export const assignDesigner = async (req, res) => {
  try {
    const { designerId } = req.body

    const design = await CustomDesign.findById(req.params.id)
    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    const designer = await User.findById(designerId)
    if (!designer || designer.role !== "designer") {
      return res.status(400).json({ message: "Invalid designer" })
    }

    design.assignedDesigner = designerId
    const updatedDesign = await design.save()

    res.json(updatedDesign)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Update custom design status
 * @route   PUT /api/custom-designs/:id/status
 * @access  Private/Designer
 */
export const updateDesignStatus = async (req, res) => {
  try {
    const { status, designerNotes, estimatedPrice } = req.body

    const design = await CustomDesign.findById(req.params.id)
    if (!design) {
      return res.status(404).json({ message: "Custom design not found" })
    }

    // Check if the user is authorized to update this design's status
    if (design.assignedDesigner?.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this design status" })
    }

    design.status = status

    if (designerNotes) {
      design.designerNotes = designerNotes
    }

    if (estimatedPrice) {
      design.estimatedPrice = estimatedPrice
    }

    const updatedDesign = await design.save()

    res.json(updatedDesign)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get all custom designs (admin/designer)
 * @route   GET /api/custom-designs/all
 * @access  Private/Designer
 */
export const getAllCustomDesigns = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Build filter object based on query parameters
    const filter = {}

    if (req.query.status) {
      filter.status = req.query.status
    }

    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.user) {
      filter.user = req.query.user
    }

    // If designer, only show designs assigned to them
    if (req.user.role === "designer") {
      filter.assignedDesigner = req.user._id
    }

    const count = await CustomDesign.countDocuments(filter)

    const designs = await CustomDesign.find(filter)
      .populate("user", "firstName lastName email")
      .populate("baseProduct", "name images")
      .populate("assignedDesigner", "firstName lastName")
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      designs,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

