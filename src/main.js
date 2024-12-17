import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import particlesVertexShader from './shaders/particles/vertex.glsl?raw'
import particlesFragmentShader from './shaders/particles/fragment.glsl?raw'

/**
 * Base
 */
// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

// Loaders
const textureLoader = new THREE.TextureLoader()

const imgTexture = textureLoader.load('./picture-1.png')

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2)
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight
    sizes.pixelRatio = Math.min(window.devicePixelRatio, 2)

    // Materials
    particlesMaterial.uniforms.uResolution.value.set(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(sizes.pixelRatio)
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(35, sizes.width / sizes.height, 0.1, 100)
camera.position.set(0, 0, 18)
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setClearColor('#181818')
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(sizes.pixelRatio)


/**
 * Displacement
 */
const displacement = {}

//2d canvas
displacement.canvas = document.createElement("canvas")
displacement.canvas.width = 128
displacement.canvas.height = 128

// displacement.canvas.style.position='fixed'
// displacement.canvas.style.width= '256px'
// displacement.canvas.style.height= '256px'
// displacement.canvas.style.top= 0
// displacement.canvas.style.left= 0
// displacement.canvas.style.zIndex= 10

document.body.append(displacement.canvas)

//context
displacement.context = displacement.canvas.getContext("2d")
// displacement.context.fillStyle = 'red'
displacement.context.fillRect(0, 0, displacement.canvas.width, displacement.canvas.height)

//imgae
displacement.glowImge = new Image()
displacement.glowImge.src = './glow.png'

// interactive plance

displacement.interactivePlane =  new THREE.Mesh(
    new THREE.PlaneGeometry(10, 10),
    new THREE.MeshBasicMaterial({ color: 'red',side: THREE.DoubleSide}) 
)
displacement.interactivePlane.visible = false
scene.add(displacement.interactivePlane)

displacement.rayCaster = new THREE.Raycaster()

// coordinate
displacement.screenCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursor = new THREE.Vector2(9999, 9999)
displacement.canvasCursorPrevious = new THREE.Vector2(9999, 9999)


window.addEventListener("pointermove", (event) => {
    displacement.screenCursor.x = (event.clientX / sizes.width) * 2 - 1,
    displacement.screenCursor.y = -(event.clientY / sizes.height) *2 + 1
})

// texture
displacement.texture = new THREE.CanvasTexture( displacement.canvas)


/**
 * Particles
 */
const particlesGeometry = new THREE.PlaneGeometry(10, 10, 128, 128)
particlesGeometry.setIndex(null)
particlesGeometry.deleteAttribute('normal')

// displacement intensity array

const intensitiesArray = new Float32Array(particlesGeometry.attributes.position.array)
const angleArray = new Float32Array(particlesGeometry.attributes.position.array)

for (let i = 0; i <= particlesGeometry.attributes.position.array.length; i++){
    intensitiesArray[i] = Math.random()
    angleArray[i] = Math.random() * Math.PI * 2
}

particlesGeometry.setAttribute('aIntensity',new THREE.BufferAttribute(intensitiesArray, 1))
particlesGeometry.setAttribute('aAngle', new THREE.BufferAttribute(angleArray, 1))

const particlesMaterial = new THREE.ShaderMaterial({
    vertexShader: particlesVertexShader,
    fragmentShader: particlesFragmentShader,
    uniforms:
    {
        uResolution: new THREE.Uniform(new THREE.Vector2(sizes.width * sizes.pixelRatio, sizes.height * sizes.pixelRatio)),
        uImgTexture: new THREE.Uniform(imgTexture),
        uDisplacementTexture: new THREE.Uniform(displacement.texture)
    },
    blending: THREE.AdditiveBlending
})
const particles = new THREE.Points(particlesGeometry, particlesMaterial)
scene.add(particles)

/**
 * Animate
 */
const tick = () =>
{
    // Update controls
    controls.update()

    // update rayCaster
    displacement.rayCaster.setFromCamera(displacement.screenCursor, camera)
    const intersections = displacement.rayCaster.intersectObject(displacement.interactivePlane)
    if (intersections.length){
        const uv = intersections[0].uv 
        displacement.canvasCursor.x = uv.x * displacement.canvas.width
        displacement.canvasCursor.y = ( 1 - uv.y) * displacement.canvas.height
    }

    // displacement 
    // fade out

    // speed alpha   
    const cursorDistance = displacement.canvasCursorPrevious.distanceTo(displacement.canvasCursor)
    displacement.canvasCursorPrevious.copy(displacement.canvasCursor)
    const alpha = Math.min(cursorDistance * 0.1, 1)

    displacement.context.globalCompositeOperation = 'source-over'
    displacement.context.globalAlpha = .02
    displacement.context.fillRect( 0, 0, displacement.canvas.width, displacement.canvas.height)
    displacement.context.globalCompositeOperation = 'lighten'
    const glowSize = displacement.canvas.width * .25
    displacement.context.globalAlpha = alpha
    displacement.context.drawImage(
        displacement.glowImge,
        displacement.canvasCursor.x - glowSize * .5 ,
        displacement.canvasCursor.y - glowSize * .5,
        glowSize,
        glowSize,
    )

    // texture
    displacement.texture.needsUpdate = true

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()