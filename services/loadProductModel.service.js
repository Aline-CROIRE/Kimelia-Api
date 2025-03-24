import * as THREE from 'three'; // Make sure Three.js is installed: npm install three
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'; // Or use other loaders as needed
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import path from 'path';
import fs from 'fs';

/**
 * Loads a 3D model for a product, applying size and color adjustments.
 *
 * @param {object} product - The product object (must have a `modelPath` property).
 * @param {string} size - The desired size (e.g., 'S', 'M', 'L').
 * @param {string} color - The desired color (hex code, e.g., '#FF0000').
 * @returns {Promise<THREE.Object3D|null>} - A Promise that resolves to a Three.js Object3D representing the loaded model, or null if loading fails.
 */
export async function loadProductModel(product, size, color) {
  try {
    if (!product || !product.modelPath) {
      console.error('Product or model path is missing.');
      return null;
    }

    const modelPath = product.modelPath; // Assume the product object has a modelPath property. This could be a URL or file path.

    // Determine the appropriate loader based on the file extension
    const fileExtension = path.extname(modelPath).toLowerCase();
    let loader;

    switch (fileExtension) {
      case '.gltf':
      case '.glb':
        loader = new GLTFLoader();
        break;
      case '.fbx':
        loader = new FBXLoader();
        break;
      // Add cases for other supported formats like '.obj'
      default:
        console.error('Unsupported model format:', fileExtension);
        return null;
    }

    // Load the model
    let model;
    if (loader instanceof GLTFLoader) {
        const gltf = await loader.loadAsync(modelPath);
        model = gltf.scene; // GLTF models have a "scene" property.
    } else if (loader instanceof FBXLoader) {
      model = await loader.loadAsync(modelPath);
    }
    else {
      console.error("Loader is not of type GLTFLoader or FBXLoader");
      return null;
    }

    if (!model) {
      console.error('Failed to load model from:', modelPath);
      return null;
    }

    // Apply size adjustments
    const sizeScale = getSizeScale(size);  // Assuming you have a getSizeScale function (see previous response)
    model.scale.multiplyScalar(sizeScale);

    // Apply color adjustments (if possible - depends on the model's materials)
    applyColor(model, color);

    return model;  // Return the loaded and adjusted Three.js model.

  } catch (error) {
    console.error('Error loading product model:', error);
    return null;
  }
}

/**
 *  Applies a color to all MeshStandardMaterial materials in a Three.js object.
 *  @param {THREE.Object3D} object - The Three.js object to apply the color to.
 *  @param {string} color - The hex color to apply (e.g., '#FF0000').
 */
function applyColor(object, color) {
    object.traverse((node) => {
        if (node.isMesh && node.material instanceof THREE.MeshStandardMaterial) {
            node.material.color = new THREE.Color(color);
            node.material.needsUpdate = true;  // Important to trigger material update
        }
    });
}

// Helper function (you might have this elsewhere - ensure consistency)
function getSizeScale(size) {
    switch (size.toUpperCase()) {
        case "XS": return 0.8;
        case "S": return 0.9;
        case "M": return 1.0;
        case "L": return 1.1;
        case "XL": return 1.2;
        default: return 1.0; // Default to M
    }
}
