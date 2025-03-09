import { Canvas } from "@react-three/fiber"

import "./index.css"
import Shader from "./Shader.jsx"

function App() {
  return (
    <>
      <Canvas gl={{ alpha: false, autoClear: true }} frameloop="never">
        <Shader />
      </Canvas>
    </>
  )
}

export default App
