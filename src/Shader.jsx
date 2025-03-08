import { useFBO } from "@react-three/drei"
import { useFrame, useThree, createPortal } from "@react-three/fiber"
import { useRef, useMemo, useEffect } from "react"

import vertexShader from "./shader/vertexShader.js"
import fragmentShader from "./shader/fragmentFBO.js"

import { Vector2, Vector4, Scene, OrthographicCamera, DoubleSide } from "three"

export default function Shader() {
  const { viewport, size, scene, camera, raycaster } = useThree()
  const sphereRef = useRef()
  const raycastPlaneRef = useRef()
  const fboQuadRef = useRef()
  const finalQuadRef = useRef()
  const pointer = new Vector2()

  // Create the render target (FBO)

  const fboScene = new Scene()
  const fboCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)

  const sourceTarget = useFBO()
  let targetA = useFBO()
  let targetB = useFBO()

  // Shader uniforms for the final display
  const uniforms = useMemo(
    () => ({
      uTexture: {
        value: sourceTarget.texture,
      },
      uPrev: {
        value: targetA.texture,
      },
      uResolution: {
        value: new Vector4(viewport.width, viewport.height, 1, 1),
      },
      uTime: {
        value: 0,
      },
    }),
    [sourceTarget.texture, viewport.width, viewport.height]
  )

  useEffect(() => {
    window.addEventListener("pointermove", (e) => {
      // Convert client coordinates to normalized device coordinates (-1 to +1)
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = -(e.clientY / window.innerHeight) * 2 + 1

      raycaster.setFromCamera(pointer, camera)

      // Check for intersections
      const intersects = raycaster.intersectObjects([raycastPlaneRef.current])

      if (intersects.length > 0) {
        // Do something with the first intersection
        console.log("Hit:", intersects[0].point)
      }
    })
  }, [])

  // useFrame(() => {
  // Update the raycaster with the current pointer position

  // useFrame((state) => {
  //   // Update time uniform
  //   uniforms.uTime.value = state.clock.getElapsedTime()

  //   // Update sphere position to follow pointer
  //   if (sphereRef.current) {
  //     sphereRef.current.position.x = (state.pointer.x * viewport.width) / 2
  //     sphereRef.current.position.y = (state.pointer.y * viewport.height) / 2
  //   }

  // Rendering the sourc
  // })

  return (
    <>
      {/* Plane with shader material displaying the FBO texture */}
      {/* {createPortal(
        <mesh ref={fboQuadRef} position={[0, 0, 0]}>
          <planeGeometry args={[1, 1]} />
          <shaderMaterial
            fragmentShader={fragmentShader}
            vertexShader={vertexShader}
            uniforms={uniforms}
          />
        </mesh>,
        fboScene
      )} */}
      {/* Sphere that follows the pointer */}

      <mesh ref={sphereRef} position={[0, 0, 0]}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh ref={raycastPlaneRef} position={[0, 0, 0]}>
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial visible={false} color={0xff0000} side={DoubleSide} />
      </mesh>

      {/* Final quad to display the result */}
      {/* <mesh ref={finalQuadRef} position={[0, 0, -1]}>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={sourceTarget.texture} />
      </mesh> */}
    </>
  )
}
