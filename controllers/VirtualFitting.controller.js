import VirtualFitting from "../models/VirtualFitting.model.js";
import User from "../models/user.model.js";
import Product from "../models/product.model.js";
import CustomDesign from "../models/customDesign.model.js";
import { createBodyModel } from "../services/3dModelService.js";
import { generateVirtualTryOn } from "../services/virtualTryOnService.js";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader.js";
import { loadProductModel } from "../services/loadProductModel.service.js";
import { loadCustomDesignModel } from "../services/loadCustomDesignModel.service.js";
import { renderTryOnImage } from "../services/renderTryOnImage.service.js";
import { calculateFittingResult } from "../services/calculateFittingResult.service.js";
import { calculateFittingResultForCustomDesign } from "../services/calculateFittingResultForCustomDesign.service.js";
import { getSizeScale } from "../services/getSizeScale.service.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
      const customDesignModel = await loadCustomDesignModel(customDesign, size, color); // Assuming you have such a function

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
        },
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
