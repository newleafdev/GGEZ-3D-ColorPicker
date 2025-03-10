import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { Camera, RefreshCw } from 'lucide-react';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const ColorPicker3D = () => {
  const [color, setColor] = useState('#EEEFFE');
  const [predefinedColors, setPredefinedColors] = useState([
    '#EEEFFE', '#D3B7A7', '#B19533', '#757575', 
    '#AE96D4', '#950051', '#F99963', '#E7D959',
    '#DE4343', '#BB3D43', '#706556', '#403324', 
    '#68724D', '#C2E189'
  ]);
  const [customColors, setCustomColors] = useState<string[]>([]);
  const [rotateModels, setRotateModels] = useState(false);
  const [rotationSpeed] = useState(0.01);
  const [isLoading, setIsLoading] = useState(true);
  
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const topModelRef = useRef<THREE.Object3D | null>(null);
  const bottomModelRef = useRef<THREE.Object3D | null>(null);
  const groupRef = useRef<THREE.Group | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  
  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    sceneRef.current = scene;
    
    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.z = 100; // Increased from 15 to 20 to zoom out more
    camera.position.y = 3;  // Increased from 2 to 3 for a better viewing angle
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;
    
    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(600, 600); // Increased from 300x300 to 600x600
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Enable soft shadows
    rendererRef.current = renderer;
    
    // Add renderer to DOM
    mountRef.current.appendChild(renderer.domElement);
    
    // Add OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Adds smoothness to the controls
    controls.dampingFactor = 0.05;
    controls.minDistance = 3;
    controls.maxDistance = 30;
    controls.autoRotate = false; // Disable auto rotate for the camera
    controls.autoRotateSpeed = 3;
    controls.target.set(0, 0, 0);
    controls.update();
    controlsRef.current = controls;
    
    // Natural lighting setup
    // Hemisphere light (sky and ground colors for natural ambient lighting)
    const hemisphereLight = new THREE.HemisphereLight(
      0x93c5ff, // Sky color - soft blue
      0x3d2b1f, // Ground color - soft brown
      0.7       // Intensity
    );
    scene.add(hemisphereLight);
    
    // Ambient light (adds soft global illumination)
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);
    
    // Main directional light (sun-like)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(10, 15, 8);
    directionalLight.castShadow = true;
    
    // Improve shadow quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.bias = -0.0005;
    directionalLight.shadow.radius = 4; // Add blur to the shadow edges
    
    // Expand shadow camera frustum for better coverage
    const shadowSize = 15;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    
    scene.add(directionalLight);
    
    // Secondary directional light (fill light) - much softer
    const fillLight = new THREE.DirectionalLight(0xffffeb, 0.4); // Slightly warm
    fillLight.position.set(-5, 3, -4);
    scene.add(fillLight);
    
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
      roughness: plasticRoughness * 1.8,
      envMapIntensity: 1.0,
      clearcoat: 0,
      clearcoatRoughness: plasticClearcoatRoughness,
      reflectivity: 0.01,
      envMap: cubeRenderTarget.texture
    });
    
    // Promise array for loading models
    const loadPromises = [];
    
    // Load bottom model
    const bottomPromise = new Promise<void>((resolve, reject) => {
      loader.load(
        '/bottom.glb',
        (gltf: { scene: THREE.Object3D }) => {
          const model = gltf.scene;
          model.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = bottomMaterial;
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });
          
          // Position and scale as needed
          model.position.y = 0;
          model.rotation.x = Math.PI / 2; // 90 degrees rotation in X
          model.rotation.y = 0; // Reset Y rotation
          model.scale.set(0.15, 0.15, 0.15); // Scale down the bottom model to 15% of its original size
          group.add(model);
          bottomModelRef.current = model;
          resolve();
        },
        undefined,
        (error: unknown) => {
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
        (gltf: { scene: THREE.Object3D }) => {
          const model = gltf.scene;
          model.traverse((child: THREE.Object3D) => {
            if ((child as THREE.Mesh).isMesh) {
              (child as THREE.Mesh).material = topMaterial;
              (child as THREE.Mesh).castShadow = true;
              (child as THREE.Mesh).receiveShadow = true;
            }
          });
          
          // Position and scale as needed
          model.position.y = 0.5; // Position on top of the bottom model
          model.rotation.x =  Math.PI ; // 360 degrees rotation in X
          model.rotation.y = - Math.PI ; // 90 degrees rotation in Y
          model.rotation.z = Math.PI;
          model.scale.set(0.15, 0.15, 0.15); // Scale down the top model to 15% of its original size
          group.add(model);
          topModelRef.current = model;
          resolve();
        },
        undefined,
        (error: unknown) => {
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
    floor.visible = false; // Hide the floor
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
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        // Update controls in animation loop
        controls.update();
        
        // Add object rotation if enabled
        if (rotateModels && groupRef.current) {
          groupRef.current.rotation.y += rotationSpeed; // Rotate around Y-axis
        }
        
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
      
      if (controlsRef.current) {
        controlsRef.current.dispose(); // Clean up controls
      }
      
      if (mountRef.current && rendererRef.current) {
        try {
          // Check if the element is actually a child before trying to remove it
          if (mountRef.current.contains(rendererRef.current.domElement)) {
            mountRef.current.removeChild(rendererRef.current.domElement);
          }
        } catch (error) {
          console.warn('Issue removing renderer from DOM:', error);
        }
      }
      
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
    };
  }, [rotationSpeed, rotateModels]);
  
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
    <div className="flex flex-col items-center bg-gray-900 p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-5xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-white">3D Color Picker</h2>
      
      <div className="flex flex-col md:flex-row w-full md:space-x-6 space-y-4 md:space-y-0">
        {/* 3D Model Viewer - Top on mobile, Left on desktop */}
        <div className="relative w-full md:w-2/3">
          <div ref={mountRef} className="rounded-lg overflow-hidden shadow-lg w-full aspect-square bg-black">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div>
              </div>
            )}
          </div>
          
          <div className="absolute top-2 right-2 flex space-x-2 z-10">
            <button 
              onClick={toggleRotation}
              className="p-2 bg-gray-800 rounded-full text-white opacity-70 hover:opacity-100 transition"
            >
              <RefreshCw size={20} color={rotateModels ? "lightgreen" : "white"} />
            </button>
            
            <button 
              onClick={takeScreenshot}
              className="p-2 bg-gray-800 rounded-full text-white opacity-70 hover:opacity-100 transition"
            >
              <Camera size={20} />
            </button>
          </div>
        </div>
        
        {/* Color Picker Controls - Bottom on mobile, Right on desktop */}
        <div className="w-full md:w-1/3 flex flex-col space-y-4 relative z-10">
          <div className="flex flex-col bg-gray-800 p-4 rounded-lg">
            <span className="text-white text-lg font-medium mb-2">Selected Color: {color}</span>
            <input 
              type="color" 
              value={color}
              onChange={handleCustomColorChange}
              className="w-full h-12 rounded cursor-pointer"
            />
          </div>
          
          <div className="bg-gray-800 p-4 rounded-lg">
            <p className="text-gray-300 text-sm mb-2">Preset Colors:</p>
            <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-4 gap-2 sm:gap-3">
              {predefinedColors.map((c, i) => (
                <button
                  key={`preset-${i}`}
                  className="w-full aspect-square rounded-md border-2 border-gray-700 hover:scale-110 transition-transform shadow-lg"
                  style={{ backgroundColor: c }}
                  onClick={() => handleColorChange(c)}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
          
          {customColors.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg">
              <p className="text-gray-300 text-sm mb-2">Recent Colors:</p>
              <div className="grid grid-cols-4 sm:grid-cols-7 md:grid-cols-4 gap-2">
                {customColors.map((c, i) => (
                  <button
                    key={`custom-${i}`}
                    className="w-full aspect-square rounded-md border border-gray-700 hover:scale-110 transition-transform shadow-lg"
                    style={{ backgroundColor: c }}
                    onClick={() => handleColorChange(c)}
                    aria-label={`Custom color ${c}`}
                  />
                ))}
              </div>
            </div>
          )}
          
          <div className="text-gray-400 text-sm bg-gray-800 px-4 py-2 rounded-lg">
            Click on a color swatch to apply it to the top model
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPicker3D; 