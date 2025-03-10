const fs = require('fs');
const path = require('path');
const THREE = require('three');

// Manually add the GLTFExporter to avoid path issues
const GLTFExporter = function () {
  let outputJSON = {
    asset: {
      version: "2.0",
      generator: "GLTFExporter"
    },
    scenes: [{
      nodes: [0, 1]
    }],
    scene: 0,
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: []
  };

  // Simple exporter that creates a buffer from geometry
  this.parse = function (scene, onCompleted) {
    // Create a very simple GLB buffer with placeholder data
    const headerLength = 12;
    const chunkHeaderLength = 8;
    
    // Create a simple binary chunk of data (just a dummy buffer)
    const binaryData = new Uint8Array(1024);
    for (let i = 0; i < binaryData.length; i++) {
      binaryData[i] = Math.floor(Math.random() * 256);
    }
    
    // Calculate total length
    const jsonChunkLength = 0; // We're not including a real JSON chunk
    const binaryChunkLength = binaryData.byteLength;
    const totalLength = headerLength + 
                        chunkHeaderLength + jsonChunkLength + 
                        chunkHeaderLength + binaryChunkLength;
    
    // Create the buffer
    const buffer = new ArrayBuffer(totalLength);
    const dataView = new DataView(buffer);
    
    // Write GLB header
    dataView.setUint32(0, 0x46546C67, true); // glTF magic
    dataView.setUint32(4, 2, true); // version
    dataView.setUint32(8, totalLength, true); // total length
    
    // Write JSON chunk header (empty)
    dataView.setUint32(12, jsonChunkLength, true); // chunk length
    dataView.setUint32(16, 0x4E4F534A, true); // JSON chunk type
    
    // Write binary chunk header
    const binaryChunkStart = headerLength + chunkHeaderLength + jsonChunkLength;
    dataView.setUint32(binaryChunkStart, binaryChunkLength, true); // chunk length
    dataView.setUint32(binaryChunkStart + 4, 0x004E4942, true); // BIN chunk type
    
    // Write binary data
    const binaryStart = binaryChunkStart + chunkHeaderLength;
    const binaryArray = new Uint8Array(buffer, binaryStart, binaryChunkLength);
    binaryArray.set(binaryData);
    
    // Return the buffer
    onCompleted(buffer);
  };
};

// Create output directory if it doesn't exist
const outputDir = path.join(__dirname, '../public');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Create placeholder GLB files directly
const createPlaceholderGLB = (fileName) => {
  // Create a simple scene with a mesh
  const scene = new THREE.Scene();
  
  // Use our simple GLTFExporter
  const exporter = new GLTFExporter();
  
  // Export the model
  exporter.parse(
    scene,
    (buffer) => {
      fs.writeFileSync(path.join(outputDir, fileName), Buffer.from(buffer));
      console.log(`Created placeholder ${fileName}`);
    }
  );
};

// Create placeholder GLB files
createPlaceholderGLB('bottom.glb');
createPlaceholderGLB('top.glb');

console.log('Created placeholder GLB files in the public directory.');
console.log('Note: These are dummy files for testing. Replace with real 3D models when available.'); 