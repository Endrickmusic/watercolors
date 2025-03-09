import { useFBO } from "@react-three/drei"
import { useThree, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useEffect } from "react"

import vertexShader from "./shader/vertexShader.js"
import fragmentShader from "./shader/fragmentFBO.js"

import { Vector2, Vector4, Scene, OrthographicCamera, DoubleSide } from "three"

export default function Shader() {
  const { viewport, scene, camera, raycaster, gl } = useThree()
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
        value: new Vector4(viewport.width, viewport.height, 1, 1),
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

  // Custom animation loop
  useEffect(() => {
    // References to the ping-pong buffers
    let currentTargetA = targetA
    let currentTargetB = targetB

    const animate = (time) => {
      // Skip if refs aren't ready
      if (!fboQuadRef.current || !finalQuadRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
        return
      }

      // Update time uniform
      uniforms.uTime.value = time * 0.001 // Convert to seconds

      // Clear and render the main scene to sourceTarget
      gl.setRenderTarget(sourceTarget)
      gl.clear()
      gl.render(scene, camera)

      // Update shader uniforms
      fboQuadRef.current.material.uniforms.uTexture.value = sourceTarget.texture
      fboQuadRef.current.material.uniforms.uPrev.value = currentTargetB.texture

      // Clear and render the shader pass to targetA
      gl.setRenderTarget(currentTargetA)
      gl.clear()
      gl.render(fboScene, fboCamera)

      // Update the final quad's texture
      finalQuadRef.current.material.map = currentTargetA.texture

      // Clear and render finalScene to the screen
      gl.setRenderTarget(null)
      gl.clear()
      gl.render(finalScene, fboCamera)

      // Swap buffers for next frame
      const temp = currentTargetA
      currentTargetA = currentTargetB
      currentTargetB = temp

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
      {/* white scene */}
      {createPortal(
        <>
          <mesh ref={whiteQuadRef}>
            <planeGeometry args={[100, 100]} />
            <meshBasicMaterial color={0xffffff} />
          </mesh>
          <mesh>
            <boxGeometry args={[2, 2]} />
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
