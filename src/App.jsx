import { Canvas } from "@react-three/fiber"

import "./index.css"
import Shader from "./Shader.jsx"

function App() {
  return (
    <>
      <Canvas>
        <color attach="background" args={[0x000000]} />
        <Shader />
      </Canvas>
    </>
  )
}

export default App
