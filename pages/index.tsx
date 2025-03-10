import type { NextPage } from 'next';
import Head from 'next/head';
import dynamic from 'next/dynamic';

// Use dynamic import with no SSR for Three.js components
const ColorPicker3D = dynamic(() => import('../components/ColorPicker3D'), {
  ssr: false,
});

const Home: NextPage = () => {
  return (
    <div className="min-h-screen py-8 px-4 bg-gray-800">
      <Head>
        <title>3D Color Picker</title>
        <meta name="description" content="Interactive 3D Color Picker using Three.js and Next.js" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="container mx-auto">
        <h1 className="text-4xl font-bold text-center mb-6 text-white">
          GGEZ COLOR PICKER
        </h1>
        
        <div className="flex flex-col items-center justify-center max-w-5xl mx-auto">
          <p className="text-gray-300 mb-8 text-center text-lg max-w-2xl">
            Find the color that's right for you troops.
          </p>
          
          <ColorPicker3D />
          

        </div>
      </main>

      <footer className="mt-12 text-center text-gray-400 text-sm">
        GGEZ &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
};

export default Home; 