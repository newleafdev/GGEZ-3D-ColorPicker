import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Camera, RefreshCw } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

const ColorPicker3D = () => {
  const [color, setColor] = useState('#ff4500');
  const [predefinedColors, setPredefinedColors] = useState([
    '#ff4500', '#ff8c00', '#ffd700', '#32cd32', 
    '#00bfff', '#0000ff', '#8a2be2', '#ff00ff',
    '#ff1493', '#ffffff', '#c0c0c0', '#000000'
  ]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [rotateModels, setRotateModels] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const topModelRef = useRef<THREE.Object3D | null>(null);
  const bottomModelRef = useRef<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 5;
    camera.position.y = 2;
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(300, 300);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
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

    // Create group for models
    const group = new THREE.Group();
    scene.add(group);
    groupRef.current = group;
    
    // Create cube environment map for reflections
    const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(256);
    const cubeCamera = new THREE.CubeCamera(0.1, 1000, cubeRenderTarget);
    scene.add(cubeCamera);
    
    // Load GLTF models
    const loader = new GLTFLoader();
    
    // Plastic material properties
    const plasticMetalness = 0.0;  // Plastic is non-metallic
    const plasticRoughness = 0.3;  // Moderate roughness for plastic
    const plasticClearcoat = 1.0;  // Clearcoat for plastic sheen
    const plasticClearcoatRoughness = 0.1;  // Smooth clearcoat
    
    // Material for the bottom model (gray)
    const bottomMaterial = new THREE.MeshPhysicalMaterial({ 
      color: 0x808080, 
      metalness: plasticMetalness,
      roughness: plasticRoughness,
      envMapIntensity: 0.8,
      clearcoat: plasticClearcoat,
      clearcoatRoughness: plasticClearcoatRoughness,
      reflectivity: 0.5,
      envMap: cubeRenderTarget.texture
    });
    
    // Material for the top model (colorful)
    const topMaterial = new THREE.MeshPhysicalMaterial({ 
      color: new THREE.Color(color), 
      metalness: plasticMetalness,
      roughness: plasticRoughness * 0.8,
      envMapIntensity: 1.0,
      clearcoat: plasticClearcoat,
      clearcoatRoughness: plasticClearcoatRoughness,
      reflectivity: 0.5,
      envMap: cubeRenderTarget.texture
    });
    
    // Promise array for loading models
    const loadPromises = [];
    
    // Load bottom model
    const bottomPromise = new Promise<void>((resolve, reject) => {
      loader.load(
        '/bottom.glb',
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = bottomMaterial;
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });
          
          // Position and scale as needed
          model.position.y = 0;
          model.rotation.y = Math.PI; // Adjust as needed
          group.add(model);
          bottomModelRef.current = model;
          resolve();
        },
        undefined,
        (error) => {
          console.error('Error loading bottom model:', error);
          reject(error);
        }
      );
    });
    loadPromises.push(bottomPromise);
    
    // Load top model
    const topPromise = new Promise<void>((resolve, reject) => {
      loader.load(
        '/top.glb',
        (gltf) => {
          const model = gltf.scene;
          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = topMaterial;
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });
          
          // Position and scale as needed
          model.position.y = 0.5; // Position on top of the bottom model
          model.rotation.y = Math.PI; // Adjust as needed
          group.add(model);
          topModelRef.current = model;
          resolve();
        },
        undefined,
        (error) => {
          console.error('Error loading top model:', error);
          reject(error);
        }
      );
    });
    loadPromises.push(topPromise);
    
    // Wait for all models to load
    Promise.all(loadPromises)
      .then(() => {
        // Center the group
        if (group.children.length > 0) {
          const box = new THREE.Box3().setFromObject(group);
          const center = box.getCenter(new THREE.Vector3());
          group.position.x = -center.x;
          group.position.z = -center.z;
          
          // Update environment map once models are loaded
          if (topModelRef.current && bottomModelRef.current) {
            topModelRef.current.visible = false;
            bottomModelRef.current.visible = false;
            cubeCamera.position.copy(group.position);
            cubeCamera.update(renderer, scene);
            topModelRef.current.visible = true;
            bottomModelRef.current.visible = true;
          }
        }
        setIsLoading(false);
      })
      .catch(error => {
        console.error('Error loading models:', error);
        setIsLoading(false);
      });
    
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
      
      if (!ctx) return canvas;
      
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
      return canvas;
    }
    
    // Helper function to create noise texture for normal map
    function createNoiseTexture(size: number, intensity: number) {
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return canvas;
      
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
      return canvas;
    }
    
    // Animation function
    const animate = () => {
      if (rotateModels && groupRef.current) {
        groupRef.current.rotation.y += 0.005;
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (mountRef.current && rendererRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, []);
  
  // Update color when changed
  useEffect(() => {
    if (!topModelRef.current) return;
    
    topModelRef.current.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        if (mesh.material instanceof THREE.MeshPhysicalMaterial) {
          // Update the color of the material
          mesh.material.color.set(color);
          
          // Adjust metalness and roughness based on color brightness
          const colorObj = new THREE.Color(color);
          const brightness = (colorObj.r + colorObj.g + colorObj.b) / 3;
          
          // Brighter colors look better with lower metalness and higher roughness
          // Darker colors look better with higher metalness and lower roughness
          mesh.material.metalness = 0.2 + (1 - brightness) * 0.6; // 0.2 to 0.8
          mesh.material.roughness = 0.05 + brightness * 0.3;      // 0.05 to 0.35
        }
      }
    });
    
    // Update the environment map to reflect the new color
    if (rendererRef.current && sceneRef.current && topModelRef.current && bottomModelRef.current) {
      topModelRef.current.visible = false;
      bottomModelRef.current.visible = false;
      
      const cubeCamera = sceneRef.current.children.find(child => child instanceof THREE.CubeCamera);
      if (cubeCamera) {
        (cubeCamera as THREE.CubeCamera).position.copy(groupRef.current?.position || new THREE.Vector3());
        (cubeCamera as THREE.CubeCamera).update(rendererRef.current, sceneRef.current);
      }
      
      topModelRef.current.visible = true;
      bottomModelRef.current.visible = true;
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
    setRotateModels(!rotateModels);
  };
  
  const takeScreenshot = () => {
    if (!rendererRef.current) return;
    
    const dataURL = rendererRef.current.domElement.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'color-picker-' + color.substring(1) + '.png';
    link.click();
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 p-4 rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-white">3D Color Picker</h2>
      
      <div className="relative mb-4">
        <div ref={mountRef} className="rounded-lg overflow-hidden shadow-lg">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
        
        <div className="absolute top-2 right-2 flex space-x-2">
          <button 
            onClick={toggleRotation}
            className="p-1 bg-gray-800 rounded-full text-white opacity-70 hover:opacity-100 transition"
          >
            <RefreshCw size={16} color={rotateModels ? "lightgreen" : "white"} />
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
          <span className="text-white text-sm font-medium">Selected Color: {color}</span>
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
              className="w-full aspect-square rounded-sm border border-gray-700 hover:scale-110 transition"
              style={{ backgroundColor: c }}
              onClick={() => handleColorChange(c)}
              aria-label={`Color ${c}`}
            />
          ))}
        </div>
        
        {customColors.length > 0 && (
          <div className="mt-2">
            <p className="text-gray-300 text-xs mb-1">Recent Colors:</p>
            <div className="grid grid-cols-8 gap-1">
              {customColors.map((c, i) => (
                <button
                  key={`custom-${i}`}
                  className="w-full aspect-square rounded-sm border border-gray-700 hover:scale-110 transition"
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorChange(c)}
                  aria-label={`Custom color ${c}`}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="text-gray-400 text-xs">
        Click on a color swatch to apply it to the top model
      </div>
    </div>
  );
};

export default ColorPicker3D; 