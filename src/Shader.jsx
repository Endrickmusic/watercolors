import { useFBO } from "@react-three/drei"
import { useThree, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useEffect } from "react"
import * as THREE from "three"

import vertexShader from "./shader/vertexShader.js"
import fragmentShader from "./shader/fragmentFBO.js"

import { Vector2, Vector4, Scene, OrthographicCamera, DoubleSide } from "three"

export default function Shader() {
  const { viewport, scene, camera, raycaster, gl, size } = useThree()
  const sphereRef = useRef()
  const raycastPlaneRef = useRef()
  const fboQuadRef = useRef()
  const finalQuadRef = useRef()
  const whiteQuadRef = useRef()
  const pointer = new Vector2()
  const animationFrameRef = useRef()

  // Create the render targets (FBOs)
  const sourceTarget = useFBO()
  const targetA = useFBO()
  const targetB = useFBO()
  const whiteFBO = useFBO()

  // Create scenes
  const fboScene = useMemo(() => new Scene(), [])
  const fboCamera = useMemo(
    () => new OrthographicCamera(-1, 1, 1, -1, 0, 1),
    []
  )
  const finalScene = useMemo(() => new Scene(), [])
  const whiteScene = useMemo(() => new Scene(), [])

  // Shader uniforms
  const uniforms = useMemo(
    () => ({
      uTexture: { value: null },
      uPrev: { value: null },
      uResolution: {
        value: new Vector4(size.width, size.height, 1, 1),
      },
      uTime: { value: 0 },
    }),
    [viewport.width, viewport.height]
  )

  // Handle pointer events
  useEffect(() => {
    const handlePointerMove = (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, camera)

      if (raycastPlaneRef.current) {
        const intersects = raycaster.intersectObjects([raycastPlaneRef.current])
        if (intersects.length > 0 && sphereRef.current) {
          sphereRef.current.position.copy(intersects[0].point)
        }
      }
    }

    window.addEventListener("pointermove", handlePointerMove)

    return () => {
      window.removeEventListener("pointermove", handlePointerMove)
    }
  }, [camera, raycaster])

  // Render white scene once
  useEffect(() => {
    gl.setRenderTarget(whiteFBO)
    gl.clear()
    gl.render(whiteScene, camera)
    gl.setRenderTarget(null)
  }, [gl, whiteScene, camera, whiteFBO])

  // Custom animation loop
  useEffect(() => {
    // Initialize the first frame with whiteFBO
    if (targetB && whiteFBO && whiteFBO.texture) {
      // Copy whiteFBO to targetB for the first frame
      gl.setRenderTarget(targetB)
      gl.clear()

      // Create a temporary quad to copy whiteFBO to targetB
      const tempScene = new Scene()
      const tempQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: whiteFBO.texture })
      )
      tempScene.add(tempQuad)

      gl.render(tempScene, fboCamera)
      gl.setRenderTarget(null)
    }

    const animate = (time) => {
      // Skip if refs aren't ready
      if (!fboQuadRef.current || !finalQuadRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Update time uniform
      uniforms.uTime.value = time * 0.001 // Convert to seconds

      // Step 1: Render the main scene to sourceTarget
      gl.setRenderTarget(sourceTarget)
      gl.clear()
      gl.render(scene, camera)

      // Step 2: Update shader uniforms
      // Important: We're reading from targetB (previous frame) and sourceTarget (current frame)
      fboQuadRef.current.material.uniforms.uTexture.value = sourceTarget.texture
      fboQuadRef.current.material.uniforms.uPrev.value = targetB.texture

      // Step 3: Render the shader pass to targetA
      gl.setRenderTarget(targetA)
      gl.clear()
      gl.render(fboScene, fboCamera)

      // Step 4: Update the final quad's texture with targetA
      finalQuadRef.current.material.map = targetA.texture
      finalQuadRef.current.material.needsUpdate = true

      // Step 5: Render finalScene to the screen
      gl.setRenderTarget(null)
      gl.clear()
      gl.render(finalScene, fboCamera)

      // Step 6: Copy targetA to targetB for the next frame
      // This avoids the feedback loop by ensuring we never read and write to the same texture
      gl.setRenderTarget(targetB)
      gl.clear()

      // Create a temporary quad to copy targetA to targetB
      const tempScene = new Scene()
      const tempQuad = new THREE.Mesh(
        new THREE.PlaneGeometry(2, 2),
        new THREE.MeshBasicMaterial({ map: targetA.texture })
      )
      tempScene.add(tempQuad)

      gl.render(tempScene, fboCamera)

      // Continue the loop
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    // Start the animation loop
    animationFrameRef.current = requestAnimationFrame(animate)

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [
    scene,
    camera,
    gl,
    fboScene,
    fboCamera,
    finalScene,
    sourceTarget,
    targetA,
    targetB,
    whiteFBO,
    uniforms,
  ])

  return (
    <>
      {/* Shader quad for processing */}
      {createPortal(
        <mesh ref={fboQuadRef}>
          <planeGeometry args={[2, 2]} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            uniforms={uniforms}
          />
        </mesh>,
        fboScene
      )}

      {/* Final output quad */}
      {createPortal(
        <mesh ref={finalQuadRef}>
          <planeGeometry args={[2, 2]} />
          <meshBasicMaterial />
        </mesh>,
        finalScene
      )}

      {/* White scene */}
      {createPortal(
        <>
          <mesh ref={whiteQuadRef}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color={0x00ff00} />
          </mesh>
        </>,
        whiteScene
      )}

      {/* Interactive sphere */}
      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>

      {/* Invisible plane for raycasting */}
      <mesh ref={raycastPlaneRef} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} color={0xff0000} side={DoubleSide} />
      </mesh>
    </>
  )
}
