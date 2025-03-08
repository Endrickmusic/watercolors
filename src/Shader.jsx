import {} from "@react-three/drei"
import { useFrame, useThree } from "@react-three/fiber"
import { useRef, useMemo } from "react"

import vertexShader from "./shader/vertexShader.js"
import fragmentShader from "./shader/fragmentShader.js"
import { DoubleSide, Vector2 } from "three"

export default function Shader() {
  const { viewport } = useThree()
  const sphereRef = useRef()

  useFrame((state) => {
    let time = state.clock.getElapsedTime()

    // Update sphere position to follow pointer
    if (sphereRef.current) {
      // Convert normalized pointer coordinates to viewport coordinates
      sphereRef.current.position.x = (state.pointer.x * viewport.width) / 2
      sphereRef.current.position.y = (state.pointer.y * viewport.height) / 2
    }
  })

  // Define the shader uniforms with memoization to optimize performance
  const uniforms = useMemo(
    () => ({
      uTime: {
        type: "f",
        value: 1.0,
      },
      uResolution: {
        type: "v2",
        value: new Vector2(4, 3),
      },
    }),
    []
  )

  return (
    <>
      <mesh ref={sphereRef} position={[0, 0, 0]} scale={0.02}>
        <sphereGeometry />
        <meshBasicMaterial color="white" />
      </mesh>
    </>
  )
}
