import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Camera, RefreshCw } from 'lucide-react';

const ColorPicker3D = () => {
  const [color, setColor] = useState('#ff4500');
  const [predefinedColors, setPredefinedColors] = useState([
    '#FFFFFF', '#CBC6B8', '#D3B7A7', '#AE835B',
    '#B15533', '#E8DBB7', '#9B9EA0', '#757575',
    '#AE96D4', '#E8AFCF', '#950051', '#F99963',
    '#F7D959', '#DE4343', '#BB3D43', '#7D6556',
    '#4D3324', '#68724D', '#C2E189'
  ]);
  
  // Color names mapping
  const colorNames: {[key: string]: string} = {
    '#FFFFFF': 'Ivory White',
    '#CBC6B8': 'Bone White',
    '#D3B7A7': 'Latte Brown',
    '#AE835B': 'Caramel',
    '#B15533': 'Terracotta',
    '#E8DBB7': 'Desert Tan',
    '#9B9EA0': 'Ash Gray',
    '#757575': 'Nardo Gray',
    '#AE96D4': 'Lilac Purple',
    '#E8AFCF': 'Sakura Pink',
    '#950051': 'Plum',
    '#F99963': 'Mandarin Orange',
    '#F7D959': 'Lemon Yellow',
    '#DE4343': 'Scarlet Red',
    '#BB3D43': 'Dark Red',
    '#7D6556': 'Dark Brown',
    '#4D3324': 'Dark Chocolate',
    '#68724D': 'Dark Green',
    '#C2E189': 'Apple Green'
  };
  
  // Helper function to get color name
  const getColorName = (hexColor: string) => {
    const upperHex = hexColor.toUpperCase();
    return colorNames[upperHex] || hexColor;
  };
  
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [rotateBox, setRotateBox] = useState(true);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const boxRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
    camera.position.z = -900;  // Safe distance within the far clipping plane
    camera.position.y = 4;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 300); // Initial size, will be updated by responsive sizing
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    
    // Add renderer to DOM
    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }
    
    // Set up responsive sizing
    const handleResize = () => {
      if (mountRef.current && rendererRef.current && cameraRef.current) {
        // Get the container's dimensions (respecting aspect-square CSS)
        const containerWidth = mountRef.current.clientWidth;
        
        // Set renderer size to match container (square aspect ratio)
        rendererRef.current.setSize(containerWidth, containerWidth);
        
        // Update camera aspect ratio and adjust field of view for smaller screens
        cameraRef.current.aspect = 1;
        
        // Dynamically adjust the field of view for smaller screens
        // Wider FOV for smaller screens to fit more content
        if (containerWidth < 400) {
          cameraRef.current.fov = 75; // Wider FOV for small screens
        } else {
          cameraRef.current.fov = 65; // Default FOV for larger screens
        }
        
        cameraRef.current.updateProjectionMatrix();
        
        // Re-render the scene
        if (sceneRef.current) {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
      }
    };
    
    // Initial sizing
    handleResize();
    
    // Add resize event listener
    window.addEventListener('resize', handleResize);
    
    // Enhanced lighting setup for PBR
    // Ambient light (softer)
    const ambientLight = new THREE.AmbientLight(0x202020, 0.5);
    scene.add(ambientLight);
    
    // Main directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
    directionalLight.position.set(5, 10, 7);
    directionalLight.castShadow = true;
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.001;
    scene.add(directionalLight);
    
    // Rim light (cooler tone)
    const rimLight = new THREE.PointLight(0x6495ED, 1);
    rimLight.position.set(-5, 3, -5);
    scene.add(rimLight);
    
    // Fill light (warmer tone)
    const fillLight = new THREE.PointLight(0xFFD700, 0.7);
    fillLight.position.set(-5, 5, 5);
    fillLight.castShadow = true;
    fillLight.shadow.mapSize.width = 512;
    fillLight.shadow.mapSize.height = 512;
    scene.add(fillLight);
    
    // Ground bounce light (subtle)
    const bounceLight = new THREE.PointLight(0x3D3D3D, 0.4);
    bounceLight.position.set(0, -2, 3);
    scene.add(bounceLight);
    
    // Create box with plastic PBR materials
    const boxGeometry = new THREE.BoxGeometry(1.0, 0.5, 1.5);  // Reduced further to 50% of original size
    
    // Plastic material properties
    const plasticMetalness = 0.0;  // Plastic is non-metallic
    const plasticRoughness = 0.5;  // Moderate roughness for plastic
    const plasticClearcoat = 0.5;  // Clearcoat for plastic sheen
    const plasticClearcoatRoughness = 0.1;  // Smooth clearcoat
    
    // Create materials with MeshPhysicalMaterial for plastic look
    const boxMaterials = [
      new THREE.MeshPhysicalMaterial({ 
        color: 0x808080, 
        metalness: plasticMetalness,
        roughness: plasticRoughness,
        envMapIntensity: 0.8,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      }), // right
      new THREE.MeshPhysicalMaterial({ 
        color: 0x808080, 
        metalness: plasticMetalness,
        roughness: plasticRoughness,
        envMapIntensity: 0.8,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      }), // left
      new THREE.MeshPhysicalMaterial({ 
        color: new THREE.Color(color), 
        metalness: plasticMetalness,
        roughness: plasticRoughness * 0.8, // Slightly smoother top
        envMapIntensity: 1.0,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      }), // top
      new THREE.MeshPhysicalMaterial({ 
        color: 0x808080, 
        metalness: plasticMetalness,
        roughness: plasticRoughness,
        envMapIntensity: 0.8,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      }), // bottom
      new THREE.MeshPhysicalMaterial({ 
        color: 0x808080, 
        metalness: plasticMetalness,
        roughness: plasticRoughness,
        envMapIntensity: 0.8,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      }), // front
      new THREE.MeshPhysicalMaterial({ 
        color: 0x808080, 
        metalness: plasticMetalness,
        roughness: plasticRoughness,
        envMapIntensity: 0.8,
        clearcoat: plasticClearcoat,
        clearcoatRoughness: plasticClearcoatRoughness,
        reflectivity: 0.5
      })  // back
    ];
    
    // Create cube environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Apply environment map to all materials
    boxMaterials.forEach(material => {
      material.envMap = cubeRenderTarget.texture;
    });
    
    const box = new THREE.Mesh(boxGeometry, boxMaterials);
    box.position.y = 0.5;
    box.castShadow = true;
    box.receiveShadow = true;
    scene.add(box);
    boxRef.current = box;
    
    // Update cube map once
    box.visible = false;
    cubeCamera.position.copy(box.position);
    cubeCamera.update(renderer, scene);
    box.visible = true;
    
    // Enhanced floor with PBR
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x111111,
      roughness: 0.7,
      metalness: 0.5,
      envMap: cubeRenderTarget.texture,
      envMapIntensity: 0.8
    });
    
    // Create subtle grid pattern for the floor
    const floorTexSize = 2048;
    const floorTexture = new THREE.CanvasTexture(createGridTexture(floorTexSize, 0x222222, 0x111111));
    floorTexture.wrapS = THREE.RepeatWrapping;
    floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(10, 10);
    floorMaterial.map = floorTexture;
    
    // Add normal map for subtle surface detail
    const normalMap = new THREE.CanvasTexture(createNoiseTexture(512, 0.15));
    floorMaterial.normalMap = normalMap;
    floorMaterial.normalScale = new THREE.Vector2(0.15, 0.15);
    
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);
    
    // Helper function to create grid texture
    function createGridTexture(size: number, lineColor: number, backgroundColor: number) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Fill background
        ctx.fillStyle = `#${backgroundColor.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, size, size);
        
        // Draw grid lines
        ctx.strokeStyle = `#${lineColor.toString(16).padStart(6, '0')}`;
        ctx.lineWidth = 2;
        
        const gridSize = size / 10;
        ctx.beginPath();
        
        // Vertical lines
        for (let i = 0; i <= size; i += gridSize) {
          ctx.moveTo(i, 0);
          ctx.lineTo(i, size);
        }
        
        // Horizontal lines
        for (let i = 0; i <= size; i += gridSize) {
          ctx.moveTo(0, i);
          ctx.lineTo(size, i);
        }
        
        ctx.stroke();
      }
      return canvas;
    }
    
    // Helper function to create noise texture for normal map
    function createNoiseTexture(size: number, intensity: number) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // Create noise
        const imageData = ctx.createImageData(size, size);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
          const value = 128 + (Math.random() - 0.5) * intensity * 255;
          data[i] = value;     // r
          data[i + 1] = value; // g
          data[i + 2] = 255;   // b - full blue for normal map
          data[i + 3] = 255;   // alpha
        }
        
        ctx.putImageData(imageData, 0, 0);
      }
      return canvas;
    }
    
    // Animation function
    const animate = () => {
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Update box position based on rotation state
        if (rotateBox && boxRef.current) {
          boxRef.current.rotation.y += 0.01;
        }
        
        // Render scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      // Request next frame
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameRef.current!);
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      // Remove resize event listener
      window.removeEventListener('resize', handleResize);
    };
  }, []);
  
  // Update color when changed
  useEffect(() => {
    if (boxRef.current && boxRef.current.material) {
      // Update only the top face (index 2)
      boxRef.current.material[2].color.set(color);
      
      // Adjust metalness and roughness based on color brightness
      const colorObj = new THREE.Color(color);
      const brightness = (colorObj.r + colorObj.g + colorObj.b) / 3;
      
      // Brighter colors look better with lower metalness and higher roughness
      // Darker colors look better with higher metalness and lower roughness
      boxRef.current.material[2].metalness = 0.2 + (1 - brightness) * 0.6; // 0.2 to 0.8
      boxRef.current.material[2].roughness = 0.05 + brightness * 0.3;      // 0.05 to 0.35
      
      // Update the environment map to reflect the new color
      if (rendererRef.current && sceneRef.current && boxRef.current) {
        boxRef.current.visible = false;
        const cubeCamera = sceneRef.current.children.find(child => child instanceof THREE.CubeCamera);
        if (cubeCamera) {
          cubeCamera.position.copy(boxRef.current.position);
          cubeCamera.update(rendererRef.current, sceneRef.current);
        }
        boxRef.current.visible = true;
      }
    }
  }, [color]);
  
  const handleColorChange = (newColor: string) => {
    setColor(newColor);
  };
  
  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setColor(newColor);
    
    // Save custom color if not already in list
    if (!customColors.includes(newColor) && !predefinedColors.includes(newColor)) {
      setCustomColors(prev => [...prev.slice(-7), newColor]);
    }
  };
  
  const toggleRotation = () => {
    setRotateBox(!rotateBox);
  };
  
  const takeScreenshot = () => {
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'box-color-' + color.substring(1) + '.png';
    link.click();
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 p-4 rounded-lg shadow-lg max-w-md w-full mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">3D Color Picker</h2>
      
      <div className="relative mb-4 w-full">
        <div ref={mountRef} className="rounded-lg overflow-hidden shadow-lg w-full aspect-square"></div>
        
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={toggleRotation}
            className="p-1 bg-gray-800 rounded-full text-white opacity-70 hover:opacity-100 transition"
          >
            <RefreshCw size={16} color={rotateBox ? "lightgreen" : "white"} />
          </button>
          
          <button 
            onClick={takeScreenshot}
            className="p-1 bg-gray-800 rounded-full text-white opacity-70 hover:opacity-100 transition"
          >
            <Camera size={16} />
          </button>
        </div>
      </div>
      
      <div className="w-full mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white text-sm font-medium">Selected: {getColorName(color)}</span>
          <input 
            type="color" 
            value={color}
            onChange={handleCustomColorChange}
            className="w-8 h-8 rounded cursor-pointer"
          />
        </div>
        
        <div className="grid grid-cols-6 gap-2 mb-4">
          {predefinedColors.map((c, i) => (
            <button
              key={`preset-${i}`}
              className="w-full aspect-square rounded-sm border border-gray-700 hover:scale-110 transition group relative"
              style={{ backgroundColor: c }}
              onClick={() => handleColorChange(c)}
              aria-label={getColorName(c)}
              title={getColorName(c)}
            >
              <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 overflow-hidden text-center whitespace-nowrap">
                {getColorName(c)}
              </span>
            </button>
          ))}
        </div>
        
        {customColors.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-300 text-xs mb-1">Recent Colors:</p>
            <div className="grid grid-cols-8 gap-1">
              {customColors.map((c, i) => (
                <button
                  key={`custom-${i}`}
                  className="w-full aspect-square rounded-sm border border-gray-700 hover:scale-110 transition group relative"
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorChange(c)}
                  aria-label={getColorName(c)}
                  title={getColorName(c)}
                >
                  <span className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-xs p-1 opacity-0 group-hover:opacity-100 overflow-hidden text-center whitespace-nowrap">
                    {getColorName(c)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-gray-400 text-xs">
        Click on a color swatch to apply it to the box top
      </div>
    </div>
  );
};

export default ColorPicker3D;