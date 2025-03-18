import Product from "../models/product.model.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';



cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  
  api_key: process.env.CLOUDINARY_API_KEY,     
  api_secret: process.env.CLOUDINARY_API_SECRET  
});


const storage = multer.memoryStorage();
const upload = multer({ storage: storage });


// Helper function to upload image to Cloudinary
const uploadImageToCloudinary = async (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) {
        return reject(err);
      }
      resolve(result);
    });

    uploadStream.end(buffer);
  });
};


/**
 * @desc    Get all products
 * @route   GET /api/products
 * @access  Public
 */
export const getProducts = async (req, res) => {
  try {
    const pageSize = Number(req.query.pageSize) || 10
    const page = Number(req.query.page) || 1

    // Build filter object based on query parameters
    const filter = { isActive: true }

    if (req.query.category) {
      filter.category = req.query.category
    }

    if (req.query.designer) {
      filter.designer = req.query.designer
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {}
      if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice)
      if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice)
    }

    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { description: { $regex: req.query.search, $options: "i" } },
      ]
    }

    // Handle tags as an array
    if (req.query.tags) {
      const tags = Array.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(",")
      filter.tags = { $in: tags }
    }

    const count = await Product.countDocuments(filter)

    const products = await Product.find(filter)
      .populate("designer", "firstName lastName")
      .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.order === "desc" ? -1 : 1 } : { createdAt: -1 })
      .limit(pageSize)
      .skip(pageSize * (page - 1))

    res.json({
      products,
      page,
      pages: Math.ceil(count / pageSize),
      total: count,
    })
  } catch (error) {
    console.error("Error getting products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("designer", "firstName lastName email")

    if (product) {
      res.json(product)
    } else {
      res.status(404).json({ message: "Product not found" })
    }
  } catch (error) {
    console.error("Error getting product by ID:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}


/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Designer
 */
export const createProduct = [
  upload.single('image'), // 'image' should match the field name in your FormData
  async (req, res) => {
    try {
      console.log("req.body", req.body);  // Debugging
      console.log("req.file", req.file);  // Debugging

      const {
        name,
        description,
        price,
        category,
        tags,
        sizes,
        colors,
        materials,
        isCustomizable,
        customizationOptions,
      } = req.body;

      // **IMPORTANT**: You need to convert price from string to Number.
      const parsedPrice = Number(price);

      if (isNaN(parsedPrice)) {
        return res.status(400).json({ message: "Invalid price. Price must be a number." });
      }


      let imageUrls = []; // To store the Cloudinary URLs

      if (req.file) {
        try {
          const cloudinaryResult = await uploadImageToCloudinary(req.file.buffer, {
            folder: 'products', // Organize images in a 'products' folder on Cloudinary
          });

          imageUrls.push(cloudinaryResult.secure_url); // Add the secure URL
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
          return res.status(500).json({ message: "Failed to upload image to Cloudinary", error: uploadError.message });
        }
      }


      const product = new Product({
        name,
        description,
        price: parsedPrice, // Use the converted price
        images: imageUrls,    // Store the array of image URLs
        designer: req.user._id,
        category,
        tags,
        sizes,
        colors,
        materials,
        isCustomizable,
        customizationOptions,
      });

      const createdProduct = await product.save();
      res.status(201).json(createdProduct);

    } catch (error) {
      console.error("Error creating product:", error);

      if (error.name === 'ValidationError') {
        console.error("Mongoose validation errors:", error.errors);
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Server error", error: error.message });
    }
  }
];




/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Designer
 */
export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user is the designer of the product or an admin
    if (product.designer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to update this product" });
    }

    // Update product fields
    Object.keys(req.body).forEach((key) => {
      product[key] = req.body[key];
    });

    const updatedProduct = await product.save();
    res.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Designer
 */
export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Check if the user is the designer of the product or an admin
    if (product.designer.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    await product.deleteOne();
    res.json({ message: "Product removed" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Create a product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createProductReview = async (req, res) => {
  try {
    const { rating, review } = req.body

    const product = await Product.findById(req.params.id)

    if (!product) {
      return res.status(404).json({ message: "Product not found" })
    }

    // Check if user already reviewed the product
    const alreadyReviewed = product.ratings.find((r) => r.user.toString() === req.user._id.toString())

    if (alreadyReviewed) {
      return res.status(400).json({ message: "Product already reviewed" })
    }

    const newReview = {
      user: req.user._id,
      rating: Number(rating),
      review,
    }

    product.ratings.push(newReview)

    // Update average rating
    const totalRating = product.ratings.reduce((acc, item) => acc + item.rating, 0)
    product.averageRating = totalRating / product.ratings.length

    await product.save()
    res.status(201).json({ message: "Review added" })
  } catch (error) {
    console.error("Error creating product review:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

/**
 * @desc    Get top rated products
 * @route   GET /api/products/top
 * @access  Public
 */
export const getTopProducts = async (req, res) => {
  try {
    const products = await Product.find({ isActive: true }).sort({ averageRating: -1 }).limit(5)

    res.json(products)
  } catch (error) {
    console.error("Error getting top products:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}