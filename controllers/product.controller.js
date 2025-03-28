import Product from "../models/product.model.js";
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import asyncHandler from 'express-async-handler'; // For cleaner error handling

// **IMPORTANT:** Configure Cloudinary (or your chosen cloud storage)
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// **IMPORTANT:** Set up Multer
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
export const getProducts = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;

    const filter = { isActive: true };

    // Filter by seller if specified
    if (req.query.seller) {
        filter.seller = req.query.seller;
    }

    if (req.query.category) {
        filter.category = req.query.category;
    }

    if (req.query.designer) {
        filter.designer = req.query.designer;
    }

    if (req.query.minPrice || req.query.maxPrice) {
        filter.price = {};
        if (req.query.minPrice) filter.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filter.price.$lte = Number(req.query.maxPrice);
    }

    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } },
        ];
    }

    if (req.query.tags) {
        const tags = Array.isArray(req.query.tags) ? req.query.tags : req.query.tags.split(",");
        filter.tags = { $in: tags };
    }

    const count = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .populate("designer", "firstName lastName")
        .populate("seller", "firstName lastName companyName")
        .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.order === "desc" ? -1 : 1 } : { createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
    });
});

/**
 * @desc    Get products for a specific seller
 * @route   GET /api/sellers/products
 * @access  Private/Seller
 */
export const getSellerProducts = asyncHandler(async (req, res) => {
    const pageSize = Number(req.query.pageSize) || 10;
    const page = Number(req.query.page) || 1;

    // Only return products for the authenticated seller
    const filter = { seller: req.user._id };

    if (req.query.category) {
        filter.category = req.query.category;
    }

    if (req.query.search) {
        filter.$or = [
            { name: { $regex: req.query.search, $options: "i" } },
            { description: { $regex: req.query.search, $options: "i" } },
        ];
    }

    if (req.query.status) {
        filter.isActive = req.query.status === 'active';
    }

    const count = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .populate("designer", "firstName lastName")
        .sort(req.query.sortBy ? { [req.query.sortBy]: req.query.order === "desc" ? -1 : 1 } : { createdAt: -1 })
        .limit(pageSize)
        .skip(pageSize * (page - 1));

    res.json({
        products,
        page,
        pages: Math.ceil(count / pageSize),
        total: count,
    });
});

/**
 * @desc    Get product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
export const getProductById = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id)
        .populate("designer", "firstName lastName email")
        .populate("seller", "firstName lastName companyName email");

    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ message: "Product not found" });
    }
});

/**
 * @desc    Create a product
 * @route   POST /api/products
 * @access  Private/Designer/Admin/Seller (Not customer)
 */
export const createProduct = [
    upload.single('image'), // 'image' should match the field name in your FormData
    asyncHandler(async (req, res) => {
        // Role-based access control: Disallow customers from creating products
        if (req.user.role === 'customer') {
            return res.status(403).json({ message: "Customers are not allowed to create products" });
        }

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
            designerId, // Optional: Allow specifying a designer if different from seller
        } = req.body;

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

        // Determine the designer - either specified or the current user
        const designer = designerId || req.user._id;

        const product = new Product({
            name,
            description,
            price: parsedPrice, // Use the converted price
            images: imageUrls,    // Store the array of image URLs
            designer: designer,
            seller: req.user._id, // Set the seller to the current user
            category,
            tags: tags ? tags.split(',') : [],
            sizes: typeof sizes === 'string' ? sizes.split(',') : [],
            colors: typeof colors === 'string' ? colors.split(',') : [],
            materials: typeof materials === 'string' ? materials.split(',') : [],
            isCustomizable: isCustomizable === 'true', // checking for value before set
            customizationOptions,
            createdBy: req.user._id, // Track who created the product
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    })
];

/**
 * @desc    Update a product
 * @route   PUT /api/products/:id
 * @access  Private/Designer/Admin/Seller (Not customer)
 */
export const updateProduct = [
    upload.single('image'), // Allow image updates
    asyncHandler(async (req, res) => {
        // Disallow customers from updating any product
        if (req.user.role === 'customer') {
            return res.status(403).json({ message: "Customers are not allowed to update products" });
        }

        const product = await Product.findById(req.params.id);

        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        // Only allow if user is the product seller, designer, or an admin
        if (
            product.seller?.toString() !== req.user._id.toString() && 
            product.designer?.toString() !== req.user._id.toString() && 
            req.user.role !== "admin"
        ) {
            return res.status(403).json({ message: "Not authorized to update this product" });
        }

        // Handle image upload if provided
        if (req.file) {
            try {
                const cloudinaryResult = await uploadImageToCloudinary(req.file.buffer, {
                    folder: 'products',
                });
                
                // Add the new image to the images array
                if (!product.images) {
                    product.images = [];
                }
                product.images.push(cloudinaryResult.secure_url);
            } catch (uploadError) {
                console.error("Cloudinary upload error:", uploadError);
                return res.status(500).json({ message: "Failed to upload image to Cloudinary", error: uploadError.message });
            }
        }

        // Update product fields
        const fieldsToUpdate = [
            'name', 'description', 'price', 'category', 'isActive', 
            'inventory', 'isCustomizable', 'customizationOptions'
        ];

        fieldsToUpdate.forEach(field => {
            if (req.body[field] !== undefined) {
                // Handle special case for price (convert to number)
                if (field === 'price') {
                    const parsedPrice = Number(req.body.price);
                    if (!isNaN(parsedPrice)) {
                        product.price = parsedPrice;
                    }
                } else {
                    product[field] = req.body[field];
                }
            }
        });

        // Handle arrays that might come as comma-separated strings
        if (req.body.tags) {
            product.tags = typeof req.body.tags === 'string' ? req.body.tags.split(',') : req.body.tags;
        }
        
        if (req.body.sizes) {
            product.sizes = typeof req.body.sizes === 'string' ? req.body.sizes.split(',') : req.body.sizes;
        }
        
        if (req.body.colors) {
            product.colors = typeof req.body.colors === 'string' ? req.body.colors.split(',') : req.body.colors;
        }
        
        if (req.body.materials) {
            product.materials = typeof req.body.materials === 'string' ? req.body.materials.split(',') : req.body.materials;
        }

        // Track who last updated the product
        product.updatedBy = req.user._id;
        product.updatedAt = Date.now();

        const updatedProduct = await product.save();
        res.json(updatedProduct);
    })
];

/**
 * @desc    Delete a product
 * @route   DELETE /api/products/:id
 * @access  Private/Designer/Admin/Seller (Not customer)
 */
export const deleteProduct = asyncHandler(async (req, res) => {
    // Disallow customers from deleting products
    if (req.user.role === 'customer') {
        return res.status(403).json({ message: "Customers are not allowed to delete products" });
    }

    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    // Only allow if user is the product seller, designer, or an admin
    if (
        product.seller?.toString() !== req.user._id.toString() && 
        product.designer?.toString() !== req.user._id.toString() && 
        req.user.role !== "admin"
    ) {
        return res.status(403).json({ message: "Not authorized to delete this product" });
    }

    // Option 1: Hard delete
    // await product.deleteOne();

    // Option 2: Soft delete (recommended for production)
    product.isActive = false;
    product.deletedAt = Date.now();
    product.deletedBy = req.user._id;
    await product.save();

    res.json({ message: "Product removed" });
});

/**
 * @desc    Create a product review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
export const createProductReview = asyncHandler(async (req, res) => {
    const { rating, review } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }

    const alreadyReviewed = product.ratings.find((r) => r.user.toString() === req.user._id.toString());

    if (alreadyReviewed) {
        return res.status(400).json({ message: "Product already reviewed" });
    }

    const newReview = {
        user: req.user._id,
        rating: Number(rating),
        review,
    };

    product.ratings.push(newReview);
    const totalRating = product.ratings.reduce((acc, item) => acc + item.rating, 0);
    product.averageRating = totalRating / product.ratings.length;
    await product.save();
    res.status(201).json({ message: "Review added" });
});

/**
 * @desc    Get top rated products
 * @route   GET /api/products/top
 * @access  Public
 */
export const getTopProducts = asyncHandler(async (req, res) => {
    const products = await Product.find({ isActive: true }).sort({ averageRating: -1 }).limit(5);
    res.json(products);
});

/**
 * @desc    Get seller dashboard stats
 * @route   GET /api/sellers/stats
 * @access  Private/Seller
 */
export const getSellerStats = asyncHandler(async (req, res) => {
    // Only return stats for the authenticated seller
    const sellerId = req.user._id;

    // Count total products for this seller
    const totalProducts = await Product.countDocuments({ seller: sellerId });
    
    // You would need to implement these based on your order model
    // This is just a placeholder structure
    const totalOrders = 0; // Replace with actual query
    const totalRevenue = 0; // Replace with actual query
    const totalCustomers = 0; // Replace with actual query

    res.json({
        totalProducts,
        totalOrders,
        totalRevenue,
        totalCustomers
    });
});

/**
 * @desc    Delete product image
 * @route   DELETE /api/products/:id/images/:imageIndex
 * @access  Private/Designer/Admin/Seller
 */
export const deleteProductImage = asyncHandler(async (req, res) => {
    const { id, imageIndex } = req.params;
    
    const product = await Product.findById(id);
    
    if (!product) {
        return res.status(404).json({ message: "Product not found" });
    }
    
    // Check authorization
    if (
        product.seller?.toString() !== req.user._id.toString() && 
        product.designer?.toString() !== req.user._id.toString() && 
        req.user.role !== "admin"
    ) {
        return res.status(403).json({ message: "Not authorized to update this product" });
    }
    
    // Validate image index
    if (!product.images || imageIndex >= product.images.length) {
        return res.status(400).json({ message: "Invalid image index" });
    }
    
    // Remove the image from the array
    product.images.splice(imageIndex, 1);
    await product.save();
    
    res.json({ message: "Image removed", images: product.images });
});

/**
 * @desc    Bulk update product status (active/inactive)
 * @route   PUT /api/sellers/products/bulk-status
 * @access  Private/Seller
 */
export const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
    const { productIds, isActive } = req.body;
    
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ message: "Product IDs are required" });
    }
    
    // Only allow sellers to update their own products
    const sellerId = req.user._id;
    
    // Find all products that belong to this seller and are in the productIds list
    const products = await Product.find({
        _id: { $in: productIds },
        seller: sellerId
    });
    
    if (products.length === 0) {
        return res.status(404).json({ message: "No matching products found" });
    }
    
    // Update all found products
    const updatePromises = products.map(product => {
        product.isActive = isActive;
        product.updatedBy = sellerId;
        product.updatedAt = Date.now();
        return product.save();
    });
    
    await Promise.all(updatePromises);
    
    res.json({ 
        message: `${products.length} products updated`,
        updatedCount: products.length
    });
});