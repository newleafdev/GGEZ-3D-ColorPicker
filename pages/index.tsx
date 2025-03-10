import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for Three.js components
const ColorPicker3D = dynamic(() => import('../components/ColorPicker3D'), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="min-h-screen py-12 px-4">
      <Head>
        <title>3D Color Picker</title>
        <meta name="description" content="Interactive 3D Color Picker using Three.js and Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">
          3D Color Picker Demo
        </h1>
        
        <div className="flex flex-col items-center justify-center">
          <p className="text-gray-300 mb-8 text-center max-w-lg">
            This demo uses 3D models to create an interactive color picker.
            You can select colors from the swatches or pick a custom color to apply to the top model.
          </p>
          
          <ColorPicker3D />
          
          <div className="mt-8 text-sm text-gray-400 text-center">
            <p>
              Note: You need to add the 3D model files (bottom.glb and top.glb) to the public directory.
            </p>
          </div>
        </div>
      </main>

      <footer className="mt-12 text-center text-gray-500 text-sm">
        Created by newleafdev &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Home; 