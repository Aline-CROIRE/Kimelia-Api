import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import path from 'path';
import fs from 'fs';

/**
 * Loads a 3D model for a custom design, potentially loading from a file or generating procedurally.
 *
 * @param {object} customDesign - The custom design object.
 * @param {string} size - The desired size.
 * @param {string} color - The desired color (hex code).
 * @returns {Promise<THREE.Object3D|null>} - A Promise resolving to the loaded model, or null if loading fails.
 */
export async function loadCustomDesignModel(customDesign, size, color) {
  try {
    if (!customDesign) {
      console.error('Custom design is missing.');
      return null;
    }

    // Check if the custom design has a direct model path
    if (customDesign.modelPath) {
      return await loadModelFromFile(customDesign.modelPath, size, color); // Load from file if a path exists
    } else {
      // If no model path, assume some procedural generation is needed based on design data
      return await generateProceduralModel(customDesign, size, color);
    }

  } catch (error) {
    console.error('Error loading custom design model:', error);
    return null;
  }
}

/**
 * Loads a 3D model from a file path.
 *
 * @param {string} modelPath - The path to the 3D model file.
 * @param {string} size - The desired size.
 * @param {string} color - The desired color (hex code).
 * @returns {Promise<THREE.Object3D|null>} - A Promise resolving to the loaded model, or null if loading fails.
 */
async function loadModelFromFile(modelPath, size, color) {
  try {
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
      default:
        console.error('Unsupported model format:', fileExtension);
        return null;
    }

    let model;
    if (loader instanceof GLTFLoader) {
        const gltf = await loader.loadAsync(modelPath);
        model = gltf.scene;
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

    const sizeScale = getSizeScale(size);
    model.scale.multiplyScalar(sizeScale);
    applyColor(model, color);

    return model;

  } catch (error) {
    console.error('Error loading model from file:', error);
    return null;
  }
}

/**
 * Generates a 3D model procedurally based on the custom design data.
 *
 * @param {object} customDesign - The custom design object (must have design data).
 * @param {string} size - The desired size.
 * @param {string} color - The desired color (hex code).
 * @returns {THREE.Object3D|null} - A Three.js Object3D representing the generated model, or null if generation fails.
 */
function generateProceduralModel(customDesign, size, color) {
  try {
    if (!customDesign.designData) {
      console.error('Custom design data is missing for procedural generation.');
      return null;
    }

    // Example: Create a simple box based on design data.  Replace this with your actual generation logic!
    const geometry = new THREE.BoxGeometry(
      customDesign.designData.width || 1,
      customDesign.designData.height || 1,
      customDesign.designData.depth || 1
    );
    const material = new THREE.MeshStandardMaterial({ color: color });
    const model = new THREE.Mesh(geometry, material);

    const sizeScale = getSizeScale(size);
    model.scale.multiplyScalar(sizeScale);
    return model;

  } catch (error) {
    console.error('Error generating procedural model:', error);
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
