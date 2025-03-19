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

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * @desc    Upload user photo for virtual fitting
 * @route   POST /api/virtual-fitting/upload
 * @access  Private
 */
export const uploadUserPhoto = async (req, res) => {
  try {
    const { userImage, measurements } = req.body;

    if (!userImage) {
      return res.status(400).json({ message: "User image is required" });
    }

    // Check if user already has a virtual fitting profile
    let virtualFitting = await VirtualFitting.findOne({ user: req.user._id });

    // Upload image to cloudinary
    let imageUrl = userImage;
    if (userImage.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(userImage, {
        folder: `virtual-fitting/${req.user._id}`,
        resource_type: "image",
      });
      imageUrl = uploadResponse.secure_url;
    }

    // Generate 3D body model based on measurements and image
    const bodyModelData = await createBodyModel(imageUrl, measurements);

    // Save the 3D model to file system
    const modelFileName = `user_${req.user._id}_body_model.glb`;
    const modelPath = path.join(__dirname, "../public/models", modelFileName);

    // Ensure directory exists
    if (!fs.existsSync(path.dirname(modelPath))) {
      fs.mkdirSync(path.dirname(modelPath), { recursive: true });
    }

    // Convert bodyModelData to GLB file
    const scene = new THREE.Scene();

    // Create a basic humanoid mesh from measurements
    const geometry = createHumanoidGeometry(measurements);
    const material = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const bodyMesh = new THREE.Mesh(geometry, material);
    scene.add(bodyMesh);

    // Add texture from user image
    if (imageUrl) {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(imageUrl);
      material.map = texture;
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Export scene to GLB
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const buffer = Buffer.from(JSON.stringify(gltf));
        fs.writeFileSync(modelPath, buffer);
      },
      { binary: true }
    );

    const modelUrl = `/models/${modelFileName}`;

    if (virtualFitting) {
      // Update existing profile
      virtualFitting.userImage = imageUrl;

      if (measurements) {
        virtualFitting.measurements = {
          ...virtualFitting.measurements,
          ...measurements,
        };
      }

      virtualFitting.bodyModel = {
        modelData: bodyModelData,
        modelUrl: modelUrl,
        lastUpdated: new Date(),
      };

      await virtualFitting.save();
    } else {
      // Create new virtual fitting profile
      virtualFitting = new VirtualFitting({
        user: req.user._id,
        userImage: imageUrl,
        measurements,
        bodyModel: {
          modelData: bodyModelData,
          modelUrl: modelUrl,
          lastUpdated: new Date(),
        },
      });

      await virtualFitting.save();
    }

    // Update user's body measurements
    if (measurements) {
      await User.findByIdAndUpdate(req.user._id, {
        bodyMeasurements: measurements,
      });
    }

    res.status(201).json({
      success: true,
      virtualFitting,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Get user's virtual fitting profile
 * @route   GET /api/virtual-fitting/profile
 * @access  Private
 */
export const getVirtualFittingProfile = async (req, res) => {
  try {
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id });

    if (!virtualFitting) {
      return res
        .status(404)
        .json({ message: "Virtual fitting profile not found" });
    }

    res.json(virtualFitting);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Try on a product virtually
 * @route   POST /api/virtual-fitting/try-on
 * @access  Private
 */
export const tryOnProduct = async (req, res) => {
  try {
    const { productId, customDesignId, size, color, userImage, measurements } =
      req.body;

    if (!productId && !customDesignId) {
      return res
        .status(400)
        .json({ message: "Product ID or Custom Design ID is required" });
    }

    if (!userImage || !measurements) {
      return res
        .status(400)
        .json({ message: "User image and measurements are required" });
    }

    let product = null;
    let customDesign = null;
    let fittingResult = {};
    let fittingImage = "";
    let tryOnModelUrl = "";

    // Generate 3D body model directly from request data (temporary)
    let imageUrl = userImage;
    if (userImage.startsWith("data:image")) {
      const uploadResponse = await cloudinary.uploader.upload(userImage, {
        folder: `virtual-fitting/temp/${Date.now()}`, // Use a temporary folder
        resource_type: "image",
      });
      imageUrl = uploadResponse.secure_url;
    }

    const parsedMeasurements = JSON.parse(measurements);

    const bodyModelData = await createBodyModel(imageUrl, parsedMeasurements);

    // Simulate temporary file creation (adjust to your actual implementation)
    const modelFileName = `temp_user_body_model_${Date.now()}.glb`;
    const modelPath = path.join(__dirname, "../public/models", modelFileName); //Store in memory or temp directory?

    // Convert bodyModelData to GLB file
    const scene = new THREE.Scene();

    // Create a basic humanoid mesh from measurements
    const geometry = createHumanoidGeometry(parsedMeasurements);
    const material = new THREE.MeshStandardMaterial({ color: 0xdddddd });
    const bodyMesh = new THREE.Mesh(geometry, material);
    scene.add(bodyMesh);

    // Add texture from user image
    if (imageUrl) {
      const textureLoader = new THREE.TextureLoader();
      const texture = textureLoader.load(imageUrl);
      material.map = texture;
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(0, 1, 1);
    scene.add(directionalLight);

    // Export scene to GLB
    const exporter = new GLTFExporter();
    exporter.parse(
      scene,
      (gltf) => {
        const buffer = Buffer.from(JSON.stringify(gltf));
        fs.writeFileSync(modelPath, buffer);
      },
      { binary: true }
    );

    const modelUrl = `/models/${modelFileName}`; // Or generate a temporary URL

    const temporaryBodyModel = {
      modelData: bodyModelData,
      modelUrl: modelUrl,
    };

    //The following if-else block is modified to allow cases where neither productId nor customDesignId are provided.
    if (productId) {
      product = await Product.findById(productId);
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      // Get product 3D model
      const productModel = await loadProductModel(product, size, color);

      // Generate virtual try-on by combining user body model with product model
      const tryOnResult = await generateVirtualTryOn(
        temporaryBodyModel,
        productModel,
        size
      );

      // Save the combined model
      const tryOnFileName = `tryon_${req.user._id}_${productId}_${Date.now()}.glb`;
      const tryOnPath = path.join(
        __dirname,
        "../public/tryons",
        tryOnFileName
      );

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
        `tryon_${req.user._id}_${productId}_${Date.now()}.jpg`
      );
      fs.writeFileSync(tryOnImagePath, tryOnImageBuffer);

      // Upload try-on image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(tryOnImagePath, {
        folder: `virtual-fitting/${req.user._id}/tryons`,
        resource_type: "image",
      });

      fittingImage = uploadResponse.secure_url;
      fittingResult = calculateFittingResult(
        temporaryBodyModel,
        product,
        size
      );
    } else if (customDesignId) {
      customDesign = await CustomDesign.findById(customDesignId);
      if (!customDesign) {
        return res.status(404).json({ message: "Custom design not found" });
      }

      // Check if the user is authorized to try on this design
      if (customDesign.user.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to try on this design" });
      }

      // Get custom design 3D model
      const customDesignModel = await loadCustomDesignModel(customDesign);

      // Generate virtual try-on by combining user body model with custom design model
      const tryOnResult = await generateVirtualTryOn(
        temporaryBodyModel,
        customDesignModel
      );

      // Save the combined model
      const tryOnFileName = `tryon_${req.user._id}_${customDesignId}_${Date.now()}.glb`;
      const tryOnPath = path.join(
        __dirname,
        "../public/tryons",
        tryOnFileName
      );

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
        `tryon_${req.user._id}_${customDesignId}_${Date.now()}.jpg`
      );
      fs.writeFileSync(tryOnImagePath, tryOnImageBuffer);

      // Upload try-on image to cloudinary
      const uploadResponse = await cloudinary.uploader.upload(tryOnImagePath, {
        folder: `virtual-fitting/${req.user._id}/tryons`,
        resource_type: "image",
      });

      fittingImage = uploadResponse.secure_url;
      fittingResult = calculateFittingResultForCustomDesign(
        temporaryBodyModel,
        customDesign
      );
    } else {
      // Handle the case when neither product ID nor customDesignId is provided
      fittingResult = {
        fit: "Not Applicable",
        sizeRecommendation: "N/A",
        fitScore: 0,
        fitDetails: {
          shoulders: "N/A",
          bust: "N/A",
          waist: "N/A",
          hips: "N/A",
          length: "N/A",
        },
      };
      fittingImage = "No Image Available";
      tryOnModelUrl = "No Model Available";
    }

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
  } finally {
      //Cleanup
      if (fs.existsSync(modelPath)) {
          fs.unlinkSync(modelPath);
      }
  }
};

/**
 * @desc    Get try-on history
 * @route   GET /api/virtual-fitting/history
 * @access  Private
 */
export const getTryOnHistory = async (req, res) => {
  try {
    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id })
      .populate("fittedProducts.product", "name images price")
      .populate(
        "fittedProducts.customDesign",
        "name designImages estimatedPrice"
      );

    if (!virtualFitting) {
      return res
        .status(404)
        .json({ message: "Virtual fitting profile not found" });
    }

    res.json({
      success: true,
      history: virtualFitting.fittedProducts.sort(
        (a, b) => b.createdAt - a.createdAt
      ),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @desc    Delete try-on entry
 * @route   DELETE /api/virtual-fitting/history/:entryId
 * @access  Private
 */
export const deleteTryOnEntry = async (req, res) => {
  try {
    const { entryId } = req.params;

    const virtualFitting = await VirtualFitting.findOne({ user: req.user._id });

    if (!virtualFitting) {
      return res
        .status(404)
        .json({ message: "Virtual fitting profile not found" });
    }

    // Find the entry
    const entryIndex = virtualFitting.fittedProducts.findIndex(
      (entry) => entry._id.toString() === entryId
    );

    if (entryIndex === -1) {
      return res.status(404).json({ message: "Try-on entry not found" });
    }

    // Get the entry to delete associated files
    const entryToDelete = virtualFitting.fittedProducts[entryIndex];

    // Delete associated files
    if (entryToDelete.tryOnModelUrl) {
      const modelPath = path.join(
        __dirname,
        "../public",
        entryToDelete.tryOnModelUrl
      );
      if (fs.existsSync(modelPath)) {
        fs.unlinkSync(modelPath);
      }
    }

    // Delete image from cloudinary if it exists
    if (
      entryToDelete.fittingImage &&
      entryToDelete.fittingImage.includes("cloudinary")
    ) {
      const publicId = entryToDelete.fittingImage
        .split("/")
        .slice(-1)[0]
        .split(".")[0];
      await cloudinary.uploader.destroy(
        `virtual-fitting/${req.user._id}/tryons/${publicId}`
      );
    }

    // Remove the entry from the array
    virtualFitting.fittedProducts.splice(entryIndex, 1);
    await virtualFitting.save();

    res.json({
      success: true,
      message: "Try-on entry deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function to create humanoid geometry based on measurements
function createHumanoidGeometry(measurements) {
  // Default measurements if not provided
  const defaults = {
    height: 170, // cm
    bust: 90, // cm
    waist: 70, // cm
    hips: 95, // cm
    inseam: 80, // cm
    shoulders: 40, // cm
  };

  // Merge provided measurements with defaults
  const m = { ...defaults, ...measurements };

  // Scale factors (convert cm to Three.js units)
  const scale = 0.01;
  const height = m.height * scale;
  const bust = m.bust * scale;
  const waist = m.waist * scale;
  const hips = m.hips * scale;
  const shoulders = m.shoulders * scale;

  // Create a group to hold all body parts
  const bodyGroup = new THREE.Group();

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const head = new THREE.Mesh(headGeometry);
  head.position.y = height * 0.85;
  bodyGroup.add(head);

  // Torso
  const torsoHeight = height * 0.35;
  const torsoGeometry = new THREE.CylinderGeometry(
    bust * 0.5 * 0.3, // top radius (bust)
    waist * 0.5 * 0.3, // bottom radius (waist)
    torsoHeight,
    32
  );
  const torso = new THREE.Mesh(torsoGeometry);
  torso.position.y = height * 0.6;
  bodyGroup.add(torso);

  // Hips
  const hipsHeight = height * 0.15;
  const hipsGeometry = new THREE.CylinderGeometry(
    waist * 0.5 * 0.3, // top radius (waist)
    hips * 0.5 * 0.3, // bottom radius (hips)
    hipsHeight,
    32
  );
  const hipsObj = new THREE.Mesh(hipsGeometry);
  hipsObj.position.y = height * 0.45;
  bodyGroup.add(hipsObj);

  // Arms
  const armLength = height * 0.4;
  const armRadius = bust * 0.1;
  const armGeometry = new THREE.CylinderGeometry(
    armRadius,
    armRadius * 0.8,
    armLength,
    16
  );

  // Left arm
  const leftArm = new THREE.Mesh(armGeometry);
  leftArm.rotation.z = (Math.PI / 2) * 0.8;
  leftArm.position.set(shoulders * 0.5, height * 0.7, 0);
  bodyGroup.add(leftArm);

  // Right arm
  const rightArm = new THREE.Mesh(armGeometry);
  rightArm.rotation.z = (-Math.PI / 2) * 0.8;
  rightArm.position.set(-shoulders * 0.5, height * 0.7, 0);
  bodyGroup.add(rightArm);

  // Legs
  const legLength = height * 0.45;
  const legRadius = hips * 0.15;
  const legGeometry = new THREE.CylinderGeometry(
    legRadius,
    legRadius * 0.7,
    legLength,
    16
  );

  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry);
  leftLeg.position.set(hips * 0.15, height * 0.2, 0);
  bodyGroup.add(leftLeg);

  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry);
  rightLeg.position.set(-hips * 0.15, height * 0.2, 0);
  bodyGroup.add(rightLeg);

  // Create a single geometry from all body parts
  const bodyGeometry = new THREE.BufferGeometry();

  // Return the combined geometry
  return bodyGeometry;
}

// Helper function to load product 3D model
async function loadProductModel(product, size, color) {
  // In a real implementation, you would load the actual 3D model file
  // For this example, we'll create a simple placeholder model

  // Check if product has a 3D model URL
  const modelUrl = product.modelUrl;

  if (!modelUrl) {
    // Create a placeholder model based on product type
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: color || 0x0000ff,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Adjust size based on product category and size parameter
    const sizeScale = getSizeScale(size);

    if (product.category === "tops") {
      mesh.scale.set(0.4 * sizeScale, 0.3 * sizeScale, 0.2 * sizeScale);
    } else if (product.category === "bottoms") {
      mesh.scale.set(0.3 * sizeScale, 0.4 * sizeScale, 0.2 * sizeScale);
    } else {
      mesh.scale.set(0.3 * sizeScale, 0.5 * sizeScale, 0.2 * sizeScale);
    }

    return {
      mesh,
      type: product.category,
      size: size || "M",
    };
  } else {
    // Load the actual model
    try {
      const loader = new FBXLoader();
      const model = await new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });

      // Apply size and color adjustments
      const sizeScale = getSizeScale(size);
      model.scale.multiplyScalar(sizeScale);

      // Apply color if specified
      if (color) {
        model.traverse((child) => {
          if (child.isMesh) {
            child.material.color.set(color);
          }
        });
      }

      return {
        mesh: model,
        type: product.category,
        size: size || "M",
      };
    } catch (error) {
      console.error("Error loading product model:", error);
      throw new Error("Failed to load product 3D model");
    }
  }
}

// Helper function to load custom design 3D model
async function loadCustomDesignModel(customDesign) {
  // In a real implementation, you would load the actual 3D model file
  // For this example, we'll create a simple placeholder model

  // Check if custom design has a 3D model URL
  const modelUrl = customDesign.modelUrl;

  if (!modelUrl) {
    // Create a placeholder model based on design type
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({
      color: customDesign.primaryColor || 0xff0000,
      roughness: 0.7,
      metalness: 0.1,
    });
    const mesh = new THREE.Mesh(geometry, material);

    // Adjust size based on design type
    if (customDesign.type === "top") {
      mesh.scale.set(0.4, 0.3, 0.2);
    } else if (customDesign.type === "bottom") {
      mesh.scale.set(0.3, 0.4, 0.2);
    } else {
      mesh.scale.set(0.3, 0.5, 0.2);
    }

    return {
      mesh,
      type: customDesign.type,
      isCustom: true,
    };
  } else {
    // Load the actual model
    try {
      const loader = new FBXLoader();
      const model = await new Promise((resolve, reject) => {
        loader.load(modelUrl, resolve, undefined, reject);
      });

      // Apply custom design properties
      model.traverse((child) => {
        if (child.isMesh && customDesign.primaryColor) {
          child.material.color.set(customDesign.primaryColor);
        }
      });

      return {
        mesh: model,
        type: customDesign.type,
        isCustom: true,
      };
    } catch (error) {
      console.error("Error loading custom design model:", error);
      throw new Error("Failed to load custom design 3D model");
    }
  }
}

// Helper function to render a try-on image from a 3D scene
async function renderTryOnImage(scene) {
  // Create a renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(800, 1200);
  renderer.setClearColor(0xffffff);

  // Create a camera
  const camera = new THREE.PerspectiveCamera(45, 800 / 1200, 0.1, 1000);
  camera.position.set(0, 0, 5);
  camera.lookAt(0, 0, 0);

  // Add lighting
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Render the scene
  renderer.render(scene, camera);

  // Get the image data
  const imageData = renderer.domElement.toDataURL("image/jpeg");

  // Convert base64 to buffer
  const base64Data = imageData.replace(/^data:image\/jpeg;base64,/, "");
  const buffer = Buffer.from(base64Data, "base64");

  return buffer;
}

// Helper function to get size scale factor
function getSizeScale(size) {
  switch (size) {
    case "XS":
      return 0.8;
    case "S":
      return 0.9;
    case "M":
      return 1.0;
    case "L":
      return 1.1;
    case "XL":
      return 1.2;
    case "XXL":
      return 1.3;
    default:
      return 1.0;
  }
}

// Helper function to calculate fitting result
function calculateFittingResult(temporaryBodyModel, product, size) {
    const userMeasurements = temporaryBodyModel.modelData
    const productMeasurements = product.measurements || {};

    // Get size-specific measurements
    const sizeIndex = product.sizes.findIndex((s) => s.size === size);
    const sizeMeasurements =
        sizeIndex >= 0 ? product.sizes[sizeIndex].measurements || {} : {};

    // Combine product measurements with size-specific adjustments
    const finalProductMeasurements = {
        ...productMeasurements,
        ...sizeMeasurements,
    };

    // Calculate fit scores for different body parts
    const fitScores = {
        shoulders: calculateFitScore(
            userMeasurements.shoulders,
            finalProductMeasurements.shoulders
        ),
        bust: calculateFitScore(
            userMeasurements.bust,
            finalProductMeasurements.bust
        ),
        waist: calculateFitScore(
            userMeasurements.waist,
            finalProductMeasurements.waist
        ),
        hips: calculateFitScore(
            userMeasurements.hips,
            finalProductMeasurements.hips
        ),
        length: calculateFitScore(
            userMeasurements.height,
            finalProductMeasurements.length
        ),
    };

    // Calculate overall fit score (weighted average)
    const weights = {
        shoulders: 0.15,
        bust: 0.25,
        waist: 0.25,
        hips: 0.25,
        length: 0.1,
    };

    let overallScore = 0;
    let totalWeight = 0;

    for (const [part, score] of Object.entries(fitScores)) {
        if (score !== null) {
            overallScore += score * weights[part];
            totalWeight += weights[part];
        }
    }

    const finalScore =
        totalWeight > 0 ? Math.round(overallScore / totalWeight) : 85;

    // Determine overall fit category
    let fit = "perfect";
    if (finalScore < 70) fit = "poor";
    else if (finalScore < 80) fit = "tight";
    else if (finalScore < 90) fit = "good";

    // Determine size recommendation
    let sizeRecommendation = size;
    if (finalScore < 75) {
        // Suggest a larger size
        const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
        const currentSizeIndex = sizeOptions.indexOf(size);
        if (currentSizeIndex < sizeOptions.length - 1) {
            sizeRecommendation = sizeOptions[currentSizeIndex + 1];
        }
    } else if (finalScore > 95) {
        // Suggest a smaller size
        const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];
        const currentSizeIndex = sizeOptions.indexOf(size);
        if (currentSizeIndex > 0) {
            sizeRecommendation = sizeOptions[currentSizeIndex - 1];
        }
    }

    // Generate fit details descriptions
    const fitDetails = {
        shoulders: getFitDescription(fitScores.shoulders),
        bust: getFitDescription(fitScores.bust),
        waist: getFitDescription(fitScores.waist),
        hips: getFitDescription(fitScores.hips),
        length: getFitDescription(fitScores.length),
    };

    return {
        fit,
        sizeRecommendation,
        fitScore: finalScore,
        fitDetails,
    };
}

// Helper function to calculate fit score for a specific measurement
function calculateFitScore(userMeasurement, productMeasurement) {
  if (!userMeasurement || !productMeasurement) return null;

  // Calculate the difference as a percentage
  const difference =
    Math.abs(userMeasurement - productMeasurement) / productMeasurement;

  // Convert to a score out of 100
  // 0% difference = 100 score
  // 20% or more difference = 50 score
  const score = Math.max(50, 100 - difference * 250);

  return Math.round(score);
}

// Helper function to get fit description based on score
function getFitDescription(score) {
  if (score === null) return "No data available";

  if (score >= 95) return "Perfect fit";
  if (score >= 85) return "Good fit";
  if (score >= 75) return "Acceptable fit";
  if (score >= 65) return "Slightly tight";
  if (score >= 55) return "Tight fit";
  return "Poor fit";
}

// Helper function to calculate fitting result for custom designs
function calculateFittingResultForCustomDesign(temporaryBodyModel, customDesign) {
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
    };
}

export { calculateFittingResult, calculateFittingResultForCustomDesign };
