import AISuggestion from "../models/aiSuggestion.model.js"
import Product from "../models/product.model.js"

/**
 * @desc    Create or update user preferences
 * @route   POST /api/ai-suggestions/preferences
 * @access  Private
 */
export const updatePreferences = async (req, res) => {
  try {
    const { style, colors, occasions, seasonalPreferences, avoidedItems, favoriteItems } = req.body

    // Find existing preferences or create new
    let aiSuggestion = await AISuggestion.findOne({ user: req.user._id })

    if (aiSuggestion) {
      // Update existing preferences
      aiSuggestion.preferences = {
        style: style || aiSuggestion.preferences.style,
        colors: colors || aiSuggestion.preferences.colors,
        occasions: occasions || aiSuggestion.preferences.occasions,
        seasonalPreferences: seasonalPreferences || aiSuggestion.preferences.seasonalPreferences,
        avoidedItems: avoidedItems || aiSuggestion.preferences.avoidedItems,
        favoriteItems: favoriteItems || aiSuggestion.preferences.favoriteItems,
      }

      await aiSuggestion.save()
    } else {
      // Create new preferences
      aiSuggestion = new AISuggestion({
        user: req.user._id,
        preferences: {
          style: style || [],
          colors: colors || [],
          occasions: occasions || [],
          seasonalPreferences: seasonalPreferences || [],
          avoidedItems: avoidedItems || [],
          favoriteItems: favoriteItems || [],
        },
      })

      await aiSuggestion.save()
    }

    res.status(200).json({
      success: true,
      preferences: aiSuggestion.preferences,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get user preferences
 * @route   GET /api/ai-suggestions/preferences
 * @access  Private
 */
export const getPreferences = async (req, res) => {
  try {
    const aiSuggestion = await AISuggestion.findOne({ user: req.user._id })

    if (!aiSuggestion) {
      return res.status(404).json({ message: "Preferences not found" })
    }

    res.json({
      success: true,
      preferences: aiSuggestion.preferences,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Generate outfit suggestions
 * @route   POST /api/ai-suggestions/generate
 * @access  Private
 */
export const generateSuggestions = async (req, res) => {
  try {
    const { occasion, season, budget, count = 3 } = req.body

    // Get user preferences
    let aiSuggestion = await AISuggestion.findOne({ user: req.user._id })

    if (!aiSuggestion) {
      // Create default preferences if none exist
      aiSuggestion = new AISuggestion({
        user: req.user._id,
        preferences: {
          style: ["casual"],
          colors: ["blue", "black", "white"],
          occasions: ["everyday"],
          seasonalPreferences: ["all"],
          avoidedItems: [],
          favoriteItems: [],
        },
      })

      await aiSuggestion.save()
    }

    // Generate outfit suggestions based on preferences and request parameters
    const outfits = await generateOutfitSuggestions(aiSuggestion.preferences, occasion, season, budget, count)

    // Save the generated outfits
    aiSuggestion.suggestedOutfits = [...outfits, ...aiSuggestion.suggestedOutfits].slice(0, 20) // Keep only the 20 most recent suggestions

    await aiSuggestion.save()

    res.json({
      success: true,
      outfits,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Get suggested outfits history
 * @route   GET /api/ai-suggestions/outfits
 * @access  Private
 */
export const getSuggestedOutfits = async (req, res) => {
  try {
    const aiSuggestion = await AISuggestion.findOne({ user: req.user._id }).populate(
      "suggestedOutfits.products",
      "name images price category",
    )

    if (!aiSuggestion) {
      return res.status(404).json({ message: "No suggestions found" })
    }

    res.json({
      success: true,
      outfits: aiSuggestion.suggestedOutfits,
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

/**
 * @desc    Provide feedback on an outfit
 * @route   POST /api/ai-suggestions/feedback
 * @access  Private
 */
export const provideFeedback = async (req, res) => {
  try {
    const { outfitId, liked, feedback } = req.body

    if (!outfitId) {
      return res.status(400).json({ message: "Outfit ID is required" })
    }

    const aiSuggestion = await AISuggestion.findOne({ user: req.user._id })

    if (!aiSuggestion) {
      return res.status(404).json({ message: "No suggestions found" })
    }

    // Add feedback
    aiSuggestion.userFeedback.push({
      outfitId,
      liked,
      feedback,
      createdAt: new Date(),
    })

    await aiSuggestion.save()

    res.json({
      success: true,
      message: "Feedback recorded successfully",
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: "Server error", error: error.message })
  }
}

// Helper function to generate outfit suggestions
const generateOutfitSuggestions = async (preferences, occasion, season, budget, count) => {
  // In a real implementation, this would use AI/ML to generate outfits
  // For now, we'll simulate by fetching products that match the criteria

  const filter = {}

  // Apply category filters to create complete outfits
  const outfits = []

  for (let i = 0; i < count; i++) {
    // Fetch a top
    const tops = await Product.find({
      category: "tops",
      isActive: true,
      ...(budget ? { price: { $lte: budget / 2 } } : {}),
    }).limit(10)

    // Fetch bottoms
    const bottoms = await Product.find({
      category: "bottoms",
      isActive: true,
      ...(budget ? { price: { $lte: budget / 2 } } : {}),
    }).limit(10)

    // Randomly select products to create an outfit
    const top = tops[Math.floor(Math.random() * tops.length)]
    const bottom = bottoms[Math.floor(Math.random() * bottoms.length)]

    if (top && bottom) {
      outfits.push({
        outfitName: `${occasion || "Everyday"} ${season || "All-season"} Outfit ${i + 1}`,
        products: [top._id, bottom._id],
        occasion: occasion || "everyday",
        season: season || "all",
        outfitImage: `https://example.com/generated-outfit-${i + 1}.jpg`,
        createdAt: new Date(),
      })
    }
  }

  return outfits
}

