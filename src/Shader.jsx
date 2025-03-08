import { useFBO } from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo, useState } from "react"

import vertexShader from "./shader/vertexShader.js"
import fragmentShader from "./shader/fragmentFBO.js"

import {
  Scene,
  OrthographicCamera,
  Vector2,
  WebGLRenderTarget,
  LinearFilter,
  RGBAFormat,
  FloatType,
  Vector4,
} from "three"

export default function Shader() {
  const { viewport, size, scene, camera } = useThree()
  const sphereRef = useRef()

  // Create the render target (FBO)
  const renderTarget = useFBO()

  // Shader uniforms for the final display
  const uniforms = useMemo(
    () => ({
      uTexture: {
        value: renderTarget.texture,
      },
      uResolution: {
        value: new Vector4(viewport.width, viewport.height, 1, 1),
      },
      uTime: {
        value: 0,
      },
    }),
    [renderTarget.texture, viewport.width, viewport.height]
  )

  // Create a reference to the shader plane to avoid rendering it to the FBO
  const shaderPlaneRef = useRef()

  useFrame((state) => {
    // Update time uniform
    uniforms.uTime.value = state.clock.getElapsedTime()

    // Update sphere position to follow pointer
    if (sphereRef.current) {
      sphereRef.current.position.x = (state.pointer.x * viewport.width) / 2
      sphereRef.current.position.y = (state.pointer.y * viewport.height) / 2
    }

    // Hide the shader plane before rendering to FBO to avoid feedback loop
    if (shaderPlaneRef.current) {
      shaderPlaneRef.current.visible = false
    }

    // Render the main scene to the FBO
    state.gl.setRenderTarget(renderTarget)
    state.gl.render(scene, camera)
    state.gl.setRenderTarget(null)

    // Show the shader plane again for normal rendering
    if (shaderPlaneRef.current) {
      shaderPlaneRef.current.visible = true
    }
  })

  return (
    <>
      {/* Sphere that follows the pointer */}
      <mesh ref={sphereRef} position={[0, 0, 0]} scale={0.1}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>

      {/* Plane with shader material displaying the FBO texture */}
      <mesh ref={shaderPlaneRef} position={[0, 0, -2]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <shaderMaterial
          fragmentShader={fragmentShader}
          vertexShader={vertexShader}
          uniforms={uniforms}
        />
      </mesh>
    </>
  )
}
