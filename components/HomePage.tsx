import React from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, PencilIcon, SparklesIcon, VrIcon } from './icons';
import { HeroBackground } from './HeroBackground'; // <-- 1. IMPORT THE NEW COMPONENT

// Hero Section Component
const Hero = () => (
  // 2. Make the Hero section fill the entire screen height
  <div className="relative text-center h-screen flex flex-col justify-center items-center overflow-hidden">
    
    {/* --- 3. ADD THE 3D BACKGROUND --- */}
    <div className="absolute inset-0 z-0 opacity-50">
      <HeroBackground />
    </div>
    
    {/* 4. Remove the old static background patterns */}
    {/* <div className="absolute inset-0 w-full h-full" ... /> */}

    {/* 5. Make sure the text content is on top with z-10 */}
    <div className="relative z-10 animate-fade-in">
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6">
        Turn Your Sketches into
        <br />
        <span className="text-brand-primary">Stunning 3D Models</span>
      </h1>
      <p className="text-lg md:text-xl text-content-muted max-w-2xl mx-auto mb-10">
        From a 2D line drawing to a full 3D mesh. Our 2-stage AI pipeline
        understands your ideas and brings them to life.
      </p>
      <Link
        to="/workspace"
        className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-lg focus:outline-none focus:ring-4 focus:ring-brand-primary/50"
      >
        Start Creating
      </Link>
    </div>
  </div>
);

// Feature Card Component (Unchanged)
const FeatureCard: React.FC<{
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="bg-base-200/50 p-6 rounded-2xl border border-base-300/50 backdrop-blur-md">
    <div className="inline-block p-3 bg-base-300 rounded-full mb-4">
      <Icon className="w-7 h-7 text-brand-primary" />
    </div>
    <h3 className="text-2xl font-bold mb-2">{title}</h3>
    <p className="text-content-muted">{description}</p>
  </div>
);

// Main HomePage Component (Unchanged, just renders the updated Hero)
export const HomePage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-base-100 text-content antialiased">
      {/* Header (Unchanged) */}
      <header className="absolute top-0 left-0 right-0 flex items-center p-4 z-20">
        <CubeIcon className="w-7 h-7 text-brand-primary" />
        <h1 className="ml-3 text-xl font-bold tracking-wider text-content">
          Sketch-to-3D <span className="text-brand-primary font-bold">Mesh AI</span>
        </h1>
        <div className="ml-auto flex items-center gap-4">
          <Link to="/workspace" className="text-content-muted hover:text-white transition-colors">
            Sign In
          </Link>
          <Link
            to="/workspace"
            className="bg-brand-primary/80 hover:bg-brand-primary text-black font-bold py-2 px-5 rounded-full text-sm transition-all duration-300 shadow-md"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Hero />

        {/* Features Section (Unchanged) */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-12">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={PencilIcon}
              title="1. Sketch or Upload"
              description="Use our feature-rich drawing canvas to create a new sketch, or simply upload any 2D image or line art from your device."
            />
            <FeatureCard
              icon={SparklesIcon}
              title="2. AI Magic Happens"
              description="Our 2-Stage AI first converts your sketch into a photorealistic image, then uses that photo to generate a complex 3D mesh."
            />
            <FeatureCard
              icon={VrIcon}
              title="3. View & Export"
              description="Review your model in the interactive 3D viewer. Switch between variations, check quality, and export as .OBJ or .STL."
            />
          </div>
        </section>

        {/* 2D to 3D Section (Unchanged) */}
        <section className="max-w-7xl mx-auto px-6 py-20">
          <h2 className="text-4xl font-bold text-center mb-12">
            From 2D to 3D in Seconds
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-stretch">
            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300/50 flex flex-col">
              <p className="text-center font-bold mb-2 text-content-muted">INPUT SKETCH</p>
              <img 
                src="/bench1.jpg"
                alt="Input sketch" 
                className="rounded-lg w-full h-96 object-contain bg-white"
              />
            </div>
            <div className="p-4 bg-base-200/50 rounded-2xl border border-base-300/50 flex flex-col">
              <p className="text-center font-bold mb-2 text-content-muted">GENERATED 3D MODEL</p>
              <img 
                src="/image_623011.png"
                alt="Generated 3D model" 
                className="rounded-lg w-full h-96 object-contain"
              />
            </div>
          </div>
        </section>
      </main>

      {/* Footer (Unchanged) */}
      <footer className="w-full py-10 border-t border-base-300/50 mt-20">
        <div className="max-w-7xl mx-auto px-6 text-center text-content-muted">
          <p>&copy; {new Date().getFullYear()} Sketch-to-3D Mesh AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};