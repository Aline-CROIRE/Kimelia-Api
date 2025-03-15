import * as THREE from "three"
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js"

/**
 * Creates a 3D body model based on user image and measurements
 * @param {string} imageUrl - URL of the user's image
 * @param {object} measurements - User's body measurements
 * @returns {object} Body model data
 */
export async function createBodyModel(imageUrl, measurements) {
  try {
    // In a production environment, this would call an external 3D modeling API
    // For this implementation, we'll create a basic 3D model

    // Create a scene
    const scene = new THREE.Scene()

    // Create a basic humanoid mesh from measurements
    const geometry = createHumanoidGeometry(measurements)
    const material = new THREE.MeshStandardMaterial({ color: 0xdddddd })
    const bodyMesh = new THREE.Mesh(geometry, material)
    scene.add(bodyMesh)

    // Add texture from user image if available
    if (imageUrl) {
      const textureLoader = new THREE.TextureLoader()
      const texture = await new Promise((resolve) => {
        textureLoader.load(imageUrl, resolve)
      })
      material.map = texture
    }

    // Add lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5)
    scene.add(ambientLight)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(0, 1, 1)
    scene.add(directionalLight)

    // Export scene to glTF
    const modelData = await exportSceneToGLTF(scene)

    return {
      modelData,
      measurements,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error("Error creating 3D body model:", error)
    throw new Error("Failed to create 3D body model")
  }
}

/**
 * Creates a humanoid geometry based on measurements
 * @param {object} measurements - User's body measurements
 * @returns {THREE.BufferGeometry} Humanoid geometry
 */
function createHumanoidGeometry(measurements) {
  // Default measurements if not provided
  const defaults = {
    height: 170, // cm
    bust: 90, // cm
    waist: 70, // cm
    hips: 95, // cm
    inseam: 80, // cm
    shoulders: 40, // cm
  }

  // Merge provided measurements with defaults
  const m = { ...defaults, ...measurements }

  // Scale factors (convert cm to Three.js units)
  const scale = 0.01
  const height = m.height * scale
  const bust = m.bust * scale
  const waist = m.waist * scale
  const hips = m.hips * scale
  const shoulders = m.shoulders * scale

  // Create a group to hold all body parts
  const bodyGroup = new THREE.Group()

  // Head
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32)
  const head = new THREE.Mesh(headGeometry)
  head.position.y = height * 0.85
  bodyGroup.add(head)

  // Torso
  const torsoHeight = height * 0.35
  const torsoGeometry = new THREE.CylinderGeometry(
    bust * 0.5 * 0.3, // top radius (bust)
    waist * 0.5 * 0.3, // bottom radius (waist)
    torsoHeight,
    32,
  )
  const torso = new THREE.Mesh(torsoGeometry)
  torso.position.y = height * 0.6
  bodyGroup.add(torso)

  // Hips
  const hipsHeight = height * 0.15
  const hipsGeometry = new THREE.CylinderGeometry(
    waist * 0.5 * 0.3, // top radius (waist)
    hips * 0.5 * 0.3, // bottom radius (hips)
    hipsHeight,
    32,
  )
  const hipsObj = new THREE.Mesh(hipsGeometry)
  hipsObj.position.y = height * 0.45
  bodyGroup.add(hipsObj)

  // Arms
  const armLength = height * 0.4
  const armRadius = bust * 0.1
  const armGeometry = new THREE.CylinderGeometry(armRadius, armRadius * 0.8, armLength, 16)

  // Left arm
  const leftArm = new THREE.Mesh(armGeometry)
  leftArm.rotation.z = (Math.PI / 2) * 0.8
  leftArm.position.set(shoulders * 0.5, height * 0.7, 0)
  bodyGroup.add(leftArm)

  // Right arm
  const rightArm = new THREE.Mesh(armGeometry)
  rightArm.rotation.z = (-Math.PI / 2) * 0.8
  rightArm.position.set(-shoulders * 0.5, height * 0.7, 0)
  bodyGroup.add(rightArm)

  // Legs
  const legLength = height * 0.45
  const legRadius = hips * 0.15
  const legGeometry = new THREE.CylinderGeometry(legRadius, legRadius * 0.7, legLength, 16)

  // Left leg
  const leftLeg = new THREE.Mesh(legGeometry)
  leftLeg.position.set(hips * 0.15, height * 0.2, 0)
  bodyGroup.add(leftLeg)

  // Right leg
  const rightLeg = new THREE.Mesh(legGeometry)
  rightLeg.position.set(-hips * 0.15, height * 0.2, 0)
  bodyGroup.add(rightLeg)

  // Create a single geometry from all body parts
  const bodyGeometry = new THREE.BufferGeometry()

  // Return the combined geometry
  return bodyGeometry
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
