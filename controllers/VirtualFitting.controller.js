import VirtualFitting from "../models/VirtualFitting.model.js"
import User from "../models/user.model.js"
import Product from "../models/product.model.js"
import CustomDesign from "../models/customDesign.model.js"

/**
 * @desc    Upload user photo for virtual fitting
 * @route   POST /api/virtual-fitting/upload
 * @access  Private
 */
export const uploadUserPhoto = async (req, res) => {
  try {
    const { userImage, measurements } = req.body

    if (!userImage) {
      return res.status(400).json({ message: "User image is required" })
    }

    // Check if user already has a virtual fitting profile
    let virtualFitting = await VirtualFitting.findOne({ user: req.user._id })

    if (virtualFitting) {
      // Update existing profile
      virtualFitting.userImage = userImage

      if (measurements) {
        virtualFitting.measurements = {
          ...virtualFitting.measurements,
          ...measurements,
        }
      }

      // Generate or update 3D body model based on measurements and image
      // This would typically involve a call to a 3D modeling service
      virtualFitting.bodyModel = {
        // Placeholder for 3D body model data
        modelData: "Generated 3D model data would go here",
        lastUpdated: new Date(),
      }

      await virtualFitting.save()
    } else {
      // Create new virtual fitting profile
      virtualFitting = new VirtualFitting({
        user: req.user._id,
        userImage,
        measurements,
        bodyModel: {
          // Placeholder for 3D body model data
          modelData: "Generated 3D model data would go here",
          lastUpdated: new Date(),
        },
      })

      await virtualFitting.save()
    }

    // Update user's body measurements
    if (measurements) {
      await User.findByIdAndUpdate(req.user._id, {
        bodyMeasurements: measurements,
      })
    }

    res.status(201).json({
      success: true,
      virtualFitting,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get user's virtual fitting profile
 * @route   GET /api/virtual-fitting/profile
 * @access  Private
 */
export const getVirtualFittingProfile = async (req, res) => {
  try {
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id })

    if (!virtualFitting) {
      return res.status(404).json({ message: "Virtual fitting profile not found" })
    }

    res.json(virtualFitting)
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Try on a product virtually
 * @route   POST /api/virtual-fitting/try-on
 * @access  Private
 */
export const tryOnProduct = async (req, res) => {
  try {
    const { productId, customDesignId, size, color } = req.body

    if (!productId && !customDesignId) {
      return res.status(400).json({ message: "Product ID or Custom Design ID is required" })
    }

    // Get user's virtual fitting profile
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id })

    if (!virtualFitting) {
      return res.status(404).json({ message: "Virtual fitting profile not found. Please upload a photo first." })
    }

    let product = null
    let customDesign = null
    let fittingResult = {}
    let fittingImage = ""

    if (productId) {
      product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({ message: "Product not found" })
      }

      // Simulate virtual try-on process
      // In a real implementation, this would call an external service or AI model
      fittingResult = simulateVirtualFitting(virtualFitting, product, size)
      fittingImage = `https://example.com/virtual-fitting/${req.user._id}/${productId}`
    } else {
      customDesign = await CustomDesign.findById(customDesignId)
      if (!customDesign) {
        return res.status(404).json({ message: "Custom design not found" })
      }

      // Check if the user is authorized to try on this design
      if (customDesign.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to try on this design" })
      }

      // Simulate virtual try-on process for custom design
      fittingResult = simulateVirtualFittingForCustomDesign(virtualFitting, customDesign)
      fittingImage = `https://example.com/virtual-fitting/${req.user._id}/${customDesignId}`
    }

    // Add to try-on history
    const tryOnEntry = {
      product: productId || null,
      customDesign: customDesignId || null,
      fittingResult,
      fittingImage,
      fittingNotes: `Virtual try-on completed on ${new Date().toLocaleDateString()}`,
    }

    virtualFitting.fittedProducts.push(tryOnEntry)
    await virtualFitting.save()

    res.json({
      success: true,
      tryOnResult: {
        fittingResult,
        fittingImage,
        product: product
          ? {
              _id: product._id,
              name: product.name,
              images: product.images,
            }
          : null,
        customDesign: customDesign
          ? {
              _id: customDesign._id,
              name: customDesign.name,
              designImages: customDesign.designImages,
            }
          : null,
      },
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get try-on history
 * @route   GET /api/virtual-fitting/history
 * @access  Private
 */
export const getTryOnHistory = async (req, res) => {
  try {
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id })
      .populate("fittedProducts.product", "name images price")
      .populate("fittedProducts.customDesign", "name designImages estimatedPrice")

    if (!virtualFitting) {
      return res.status(404).json({ message: "Virtual fitting profile not found" })
    }

    res.json({
      success: true,
      history: virtualFitting.fittedProducts.sort((a, b) => b.createdAt - a.createdAt),
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Delete try-on entry
 * @route   DELETE /api/virtual-fitting/history/:entryId
 * @access  Private
 */
export const deleteTryOnEntry = async (req, res) => {
  try {
    const { entryId } = req.params

    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id })

    if (!virtualFitting) {
      return res.status(404).json({ message: "Virtual fitting profile not found" })
    }

    // Find and remove the entry
    const entryIndex = virtualFitting.fittedProducts.findIndex((entry) => entry._id.toString() === entryId)

    if (entryIndex === -1) {
      return res.status(404).json({ message: "Try-on entry not found" })
    }

    virtualFitting.fittedProducts.splice(entryIndex, 1)
    await virtualFitting.save()

    res.json({
      success: true,
      message: "Try-on entry deleted successfully",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper function to simulate virtual fitting
const simulateVirtualFitting = (virtualFitting, product, size) => {
  // In a real implementation, this would use AI/ML to determine fit
  const userMeasurements = virtualFitting.measurements

  // Simple simulation logic
  let fit = "perfect"
  let sizeRecommendation = size || product.sizes[0]?.size || "M"
  let fitScore = 85

  // Simulate different fit scenarios based on measurements
  if (userMeasurements.bust && product.category === "tops") {
    if (userMeasurements.bust > 100) {
      fit = "tight"
      sizeRecommendation = "L"
      fitScore = 70
    } else if (userMeasurements.bust < 80) {
      fit = "loose"
      sizeRecommendation = "S"
      fitScore = 75
    }
  }

  return {
    fit,
    sizeRecommendation,
    fitScore,
    fitDetails: {
      shoulders: "Good fit",
      bust: fit === "perfect" ? "Perfect fit" : fit === "tight" ? "Slightly tight" : "Slightly loose",
      waist: "Good fit",
      hips: "Good fit",
      length: "Good fit",
    },
  }
}

// Helper function to simulate virtual fitting for custom designs
const simulateVirtualFittingForCustomDesign = (virtualFitting, customDesign) => {
  // For custom designs, the fit should be better since it's made to measure
  return {
    fit: "perfect",
    sizeRecommendation: "Custom",
    fitScore: 95,
    fitDetails: {
      shoulders: "Perfect fit",
      bust: "Perfect fit",
      waist: "Perfect fit",
      hips: "Perfect fit",
      length: "Perfect fit",
    },
  }
}

