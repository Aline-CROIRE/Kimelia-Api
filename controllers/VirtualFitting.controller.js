import VirtualFitting from "../models/VirtualFitting.js"; // Adjust path if needed
import Product from "../models/Product.js"; // Adjust path if needed
import CustomDesign from "../models/CustomDesign.js"; // Adjust path if needed
import cloudinary from "../config/cloudinary.js"; // Adjust path if needed
import * as THREE from 'three'; // You might need to install three: npm install three
import path from 'path';
import fs from 'fs';

/**
 * @desc    Try on a product virtually
 * @route   POST /api/virtual-fitting/try-on
 * @access  Private
 */
export const tryOnProduct = async (req, res) => {
  try {
    const { productId, customDesignId, size, color } = req.body;

    // Get user's virtual fitting profile
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id });

    if (!virtualFitting) {
      return res.status(404).json({ message: "Virtual fitting profile not found. Please upload a photo first." });
    }

    let product = null;
    let customDesign = null;
    let fittingResult = {};
    let fittingImage = "";
    let tryOnModelUrl = "";

    // Check if we have an image file in the request
    const imageFile = req.file || (req.files && req.files.image);

    if (!imageFile && !virtualFitting.userImage) {
      return res.status(400).json({ message: "User image is required. Please upload a photo first or include one in this request." });
    }

    // Use the user's existing image if no new image is provided
    const userImage = imageFile ? await processUploadedImage(imageFile, req.user._id) : virtualFitting.userImage;

    if (productId) {
      // Process with product ID if provided
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get product 3D model
      const productModel = await loadProductModel(product, size, color);

      // Generate virtual try-on by combining user body model with product model
      const tryOnResult = await generateVirtualTryOn(virtualFitting.bodyModel, productModel, size);

      if (!tryOnResult) {
          return res.status(500).json({ message: "Failed to generate virtual try-on for product" });
      }

      // Save the combined model and generate image as before
      const tryOnFileName = `tryon_${req.user._id}_product_${productId}_${Date.now()}.glb`;
      const tryOnPath = path.join(__dirname, "../public/tryons", tryOnFileName);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(tryOnPath))) {
        fs.mkdirSync(path.dirname(tryOnPath), { recursive: true });
      }

      fs.writeFileSync(tryOnPath, Buffer.from(tryOnResult.modelData));
      tryOnModelUrl = `/tryons/${tryOnFileName}`;

      // Generate 2D image of the try-on
      const tryOnImageBuffer = await renderTryOnImage(tryOnResult.scene);
      const tryOnImagePath = path.join(
        __dirname,
        "../public/tryons",
        `tryon_${req.user._id}_product_${productId}_${Date.now()}.jpg`
      );
      fs.writeFileSync(tryOnImagePath, tryOnImageBuffer);

      // Upload try-on image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(tryOnImagePath, {
        folder: `virtual-fitting/${req.user._id}/tryons`,
        resource_type: "image",
      });

      fittingImage = uploadResponse.secure_url;

      fittingResult = calculateFittingResult(virtualFitting, product, size);
    } else if (customDesignId) {
      // Process with custom design ID if provided
      customDesign = await CustomDesign.findById(customDesignId);
      if (!customDesign) {
        return res.status(404).json({ message: "Custom design not found" });
      }

      // Check if the user is authorized to try on this design
      if (customDesign.user.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Not authorized to try on this design" });
      }

      // Process custom design as before
      const customDesignModel = await loadCustomDesignModel(customDesign, size, color);  // Assuming you have such a function

      const tryOnResult = await generateVirtualTryOn(virtualFitting.bodyModel, customDesignModel, size);

      if (!tryOnResult) {
          return res.status(500).json({ message: "Failed to generate virtual try-on for custom design" });
      }
       // Save the combined model and generate image as before
       const tryOnFileName = `tryon_${req.user._id}_custom_${customDesignId}_${Date.now()}.glb`;
       const tryOnPath = path.join(__dirname, "../public/tryons", tryOnFileName);

       // Ensure directory exists
       if (!fs.existsSync(path.dirname(tryOnPath))) {
         fs.mkdirSync(path.dirname(tryOnPath), { recursive: true });
       }

       fs.writeFileSync(tryOnPath, Buffer.from(tryOnResult.modelData));
       tryOnModelUrl = `/tryons/${tryOnFileName}`;

       // Generate 2D image of the try-on
       const tryOnImageBuffer = await renderTryOnImage(tryOnResult.scene);
       const tryOnImagePath = path.join(
         __dirname,
         "../public/tryons",
         `tryon_${req.user._id}_custom_${customDesignId}_${Date.now()}.jpg`
       );
       fs.writeFileSync(tryOnImagePath, tryOnImageBuffer);

       // Upload try-on image to cloudinary
       const uploadResponse = await cloudinary.uploader.upload(tryOnImagePath, {
         folder: `virtual-fitting/${req.user._id}/tryons`,
         resource_type: "image",
       });

       fittingImage = uploadResponse.secure_url;

      fittingResult = calculateFittingResultForCustomDesign(virtualFitting, customDesign);
    } else {
      // If no product or custom design is provided, generate a basic try-on with just the user model
      // This is the new functionality where no product/design ID is required

      // Create a basic/default garment model
      const defaultGarment = createDefaultGarment(size, color);

      // Generate virtual try-on with default garment
      const tryOnResult = await generateVirtualTryOn(virtualFitting.bodyModel, defaultGarment);

        if (!tryOnResult) {
            return res.status(500).json({ message: "Failed to generate virtual try-on with default garment" });
        }

      // Save the model and generate image
      const tryOnFileName = `tryon_${req.user._id}_default_${Date.now()}.glb`;
      const tryOnPath = path.join(__dirname, "../public/tryons", tryOnFileName);

      // Ensure directory exists
      if (!fs.existsSync(path.dirname(tryOnPath))) {
        fs.mkdirSync(path.dirname(tryOnPath), { recursive: true });
      }

      fs.writeFileSync(tryOnPath, Buffer.from(tryOnResult.modelData));
      tryOnModelUrl = `/tryons/${tryOnFileName}`;

      // Generate 2D image of the try-on
      const tryOnImageBuffer = await renderTryOnImage(tryOnResult.scene);
      const tryOnImagePath = path.join(
        __dirname,
        "../public/tryons",
        `tryon_${req.user._id}_default_${Date.now()}.jpg`
      );
      fs.writeFileSync(tryOnImagePath, tryOnImageBuffer);

      // Upload try-on image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(tryOnImagePath, {
        folder: `virtual-fitting/${req.user._id}/tryons`,
        resource_type: "image",
      });

      fittingImage = uploadResponse.secure_url;

      // Generate basic fitting result
      fittingResult = {
        fit: "standard",
        sizeRecommendation: size || "M",
        fitScore: 85,
        fitDetails: {
          shoulders: "Standard fit",
          bust: "Standard fit",
          waist: "Standard fit",
          hips: "Standard fit",
          length: "Standard fit",
        }
      };
    }

    // Add to try-on history
    const tryOnEntry = {
      product: productId || null,
      customDesign: customDesignId || null,
      fittingResult,
      fittingImage,
      tryOnModelUrl,
      fittingNotes: `Virtual try-on completed on ${new Date().toLocaleDateString()}`,
    };

    virtualFitting.fittedProducts.push(tryOnEntry);
    await virtualFitting.save();

    res.json({
      success: true,
      tryOnResult: {
        fittingResult,
        fittingImage,
        tryOnModelUrl,
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
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to process uploaded image
async function processUploadedImage(imageFile, userId) {
    let imagePath;

    if (imageFile.path) {
        imagePath = imageFile.path; // Path from multer
    } else if (typeof imageFile === 'string') {
        imagePath = imageFile;  // Assuming it's already a path
    } else {
        return null;  // Or throw an error
    }

  // Upload to cloudinary
  const uploadResponse = await cloudinary.uploader.upload(imagePath, {
    folder: `virtual-fitting/${userId}`,
    resource_type: "image",
  });

  return uploadResponse.secure_url;
}

// Helper function to create a default garment when no product/design is specified
function createDefaultGarment(size = "M", color = "#000000") {
  // Create a basic t-shirt model
  const geometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
  const material = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1,
  });
  const mesh = new THREE.Mesh(geometry, material);

  // Apply size scaling
  const sizeScale = getSizeScale(size);  // Assumed function
  mesh.scale.multiplyScalar(sizeScale);

  return {
    mesh,
    type: "top",
    size: size,
  };
}

// DUMMY IMPLEMENTATIONS - REPLACE WITH YOUR ACTUAL LOGIC

async function loadProductModel(product, size, color) {
    // Replace with code to load the actual 3D model for the product
    // This is a DUMMY implementation
    console.log(`Loading product model for product ${product._id}, size ${size}, color ${color}`);
    return { modelData: 'dummy product model data', type: 'product' }; // Replace with actual model data
}

async function loadCustomDesignModel(customDesign, size, color) {
    // Replace with code to load the 3D model for the custom design
    // This is a DUMMY implementation
    console.log(`Loading custom design model for design ${customDesign._id}, size ${size}, color ${color}`);
    return { modelData: 'dummy custom design model data', type: 'custom' }; // Replace with actual model data
}

async function generateVirtualTryOn(bodyModel, garmentModel, size) {
    // Replace with code to combine the body model and garment model to create a virtual try-on
    // This is a DUMMY implementation
    console.log(`Generating virtual try-on with body model ${bodyModel}, garment model type ${garmentModel.type}, size ${size}`);
    return { modelData: 'dummy try-on model data', scene: 'dummy scene data' }; // Replace with actual model data and scene
}

async function renderTryOnImage(scene) {
    // Replace with code to render a 2D image of the try-on
    // This is a DUMMY implementation
    console.log('Rendering try-on image from scene');
    return Buffer.from('dummy image data'); // Replace with actual image data
}

function calculateFittingResult(virtualFitting, product, size) {
    // Replace with code to calculate the fitting result
    // This is a DUMMY implementation
    console.log(`Calculating fitting result for product ${product._id}, size ${size}`);
    return { fit: 'Good', sizeRecommendation: size || 'M' }; // Replace with actual fitting result
}

function calculateFittingResultForCustomDesign(virtualFitting, customDesign) {
    // Replace with code to calculate the fitting result for the custom design
    // This is a DUMMY implementation
    console.log(`Calculating fitting result for custom design ${customDesign._id}`);
    return { fit: 'Perfect', sizeRecommendation: 'Custom' }; // Replace with actual fitting result
}

function getSizeScale(size) {
    // Replace with code to get the size scale based on the provided size
    // This is a DUMMY implementation
    switch (size.toUpperCase()) {
        case "XS": return 0.8;
        case "S": return 0.9;
        case "M": return 1.0;
        case "L": return 1.1;
        case "XL": return 1.2;
        default: return 1.0; // Default to M
    }
}
