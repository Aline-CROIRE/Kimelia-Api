import * as THREE from "three"
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"

/**
 * Generates a virtual try-on by combining user body model with product model
 * @param {object} bodyModel - User's body model data
 * @param {object} productModel - Product model data
 * @param {string} size - Selected size
 * @returns {object} Combined model data and scene
 */
export async function generateVirtualTryOn(bodyModel, productModel, size = "M") {
  try {
    // Create a new scene
    const scene = new THREE.Scene()

    // Load body model
    let bodyMesh
    if (bodyModel.modelData) {
      const loader = new GLTFLoader()
      const bodyGLTF = await loadGLTF(loader, bodyModel.modelData)
      bodyMesh = bodyGLTF.scene
    } else {
      // Create a placeholder body if no model data
      bodyMesh = createPlaceholderBody(bodyModel.measurements)
    }

    // Add body to scene
    scene.add(bodyMesh)

    // Position product on body based on product type
    const productMesh = productModel.mesh

    if (productModel.type === "tops" || productModel.type === "top") {
      // Position top on upper body
      productMesh.position.y = bodyModel.measurements?.height * 0.01 * 0.65 || 1.7 * 0.65
      scene.add(productMesh)
    } else if (productModel.type === "bottoms" || productModel.type === "bottom") {
      // Position bottoms on lower body
      productMesh.position.y = bodyModel.measurements?.height * 0.01 * 0.4 || 1.7 * 0.4
      scene.add(productMesh)
    } else if (productModel.type === "dresses" || productModel.type === "dress") {
      // Position dress on full body
      productMesh.position.y = bodyModel.measurements?.height * 0.01 * 0.5 || 1.7 * 0.5
      scene.add(productMesh)
    } else {
      // Default positioning
      productMesh.position.y = bodyModel.measurements?.height * 0.01 * 0.5 || 1.7 * 0.5
      scene.add(productMesh)
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(1, 1, 1)
    scene.add(directionalLight)

    // Export the combined scene
    const modelData = await exportSceneToGLTF(scene)

    return {
      modelData,
      scene,
      productType: productModel.type,
      size,
      timestamp: new Date(),
    }
  } catch (error) {
    console.error("Error generating virtual try-on:", error)
    throw new Error("Failed to generate virtual try-on")
  }
}

/**
 * Loads a GLTF model from data
 * @param {GLTFLoader} loader - The GLTF loader
 * @param {ArrayBuffer} data - The model data
 * @returns {Promise<Object>} The loaded GLTF object
 */
async function loadGLTF(loader, data) {
  return new Promise((resolve, reject) => {
    const dataURL = URL.createObjectURL(new Blob([data], { type: "application/octet-stream" }))

    loader.load(
      dataURL,
      (gltf) => {
        URL.revokeObjectURL(dataURL)
        resolve(gltf)
      },
      undefined,
      (error) => {
        URL.revokeObjectURL(dataURL)
        reject(error)
      },
    )
  })
}

/**
 * Creates a placeholder body if no model data is available
 * @param {object} measurements - User's body measurements
 * @returns {THREE.Group} A basic humanoid mesh
 */
function createPlaceholderBody(measurements) {
  // Default measurements if not provided
  const defaults = {
    height: 170, // cm
    bust: 90, // cm
    waist: 70, // cm
    hips: 95, // cm
    shoulders: 40, // cm
  }

  // Merge provided measurements with defaults
  const m = { ...defaults, ...measurements }

  // Scale factors (convert cm to Three.js units)
  const scale = 0.01
  const height = m.height * scale

  // Create a group to hold all body parts
  const bodyGroup = new THREE.Group()

  // Create a simple mannequin
  const bodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, height, 32)
  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.5,
    metalness: 0.1,
  })
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial)
  body.position.y = height / 2

  bodyGroup.add(body)

  return bodyGroup
}

/**
 * Exports a THREE.js scene to glTF format
 * @param {THREE.Scene} scene - The scene to export
 * @returns {Promise<ArrayBuffer>} The exported glTF data
 */
async function exportSceneToGLTF(scene) {
  return new Promise((resolve, reject) => {
    const exporter = new GLTFExporter()
    exporter.parse(
      scene,
      (gltf) => {
        resolve(gltf)
      },
      (error) => {
        reject(error)
      },
      { binary: true },
    )
  })
}

