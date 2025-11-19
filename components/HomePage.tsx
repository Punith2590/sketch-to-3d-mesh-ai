import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CubeIcon, PencilIcon, SparklesIcon, VrIcon, ChevronLeftIcon, ChevronRightIcon } from './icons';
import { HeroBackground } from './HeroBackground';
import { Display3DModel } from './Display3DModel';

// --- Example Data for Carousel ---
const CAROUSEL_ITEMS = [
  {
    sketch: 'face.jpeg', 
    model: 'face.obj',
    prompt: "A Human face"
  },
  {
    sketch: 'human body.jpg', 
    model: 'human body.obj',
    prompt: "A stylized human figure standing"
  },
  {
    sketch: 'house.png', 
    model: 'house.obj',
    prompt: "A small house"
  },
];

// --- Typewriter Effect Component ---
const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 100 }) => {
  const [displayText, setDisplayText] = useState('');
  
  useEffect(() => {
    let currentIndex = 0;
    const interval = setInterval(() => {
      if (currentIndex <= text.length) {
        setDisplayText(text.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(interval);
      }
    }, delay);
    
    return () => clearInterval(interval);
  }, [text, delay]);

  return (
    <span>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
};

// Hero Section Component
const Hero = () => (
  <div className="relative text-center h-screen flex flex-col justify-center items-center overflow-hidden">
    
    {/* 3D Background with Stars & Floating Mesh */}
    <div className="absolute inset-0 z-0">
      <HeroBackground />
    </div>
    
    {/* Gradient Overlay to ensure text readability */}
    <div className="absolute inset-0 bg-gradient-to-b from-base-100/30 via-transparent to-base-100/80 z-0 pointer-events-none"></div>

    <div className="relative z-10 animate-fade-in px-4">
      <div className="mb-6 inline-flex items-center gap-2 py-1 px-3 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-xs font-medium text-brand-primary">
        <SparklesIcon className="w-3 h-3" />
        <span>AI-Powered Generation V1.0</span>
      </div>
      
      <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-tight">
        Turn Your Sketches into
        <br />
        <span className="text-brand-primary drop-shadow-[0_0_15px_rgba(57,255,20,0.5)]">
           <TypewriterText text="Stunning 3D Models" />
        </span>
      </h1>
      
      <p className="text-lg md:text-xl text-content-muted max-w-2xl mx-auto mb-10 leading-relaxed">
        From a simple 2D line drawing to a fully editable 3D mesh. 
        <br className="hidden md:block" />
        Our 2-stage AI pipeline understands your ideas and brings them to life.
      </p>
      
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <Link
            to="/workspace"
            className="bg-brand-primary hover:bg-brand-primary/90 text-black font-bold py-4 px-10 rounded-full text-lg transition-all duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(57,255,20,0.4)] hover:shadow-[0_0_30px_rgba(57,255,20,0.6)] focus:outline-none focus:ring-4 focus:ring-brand-primary/50 flex items-center gap-2"
        >
            <CubeIcon className="w-5 h-5" />
            Start Creating
        </Link>
        <a 
            href="#how-it-works"
            className="text-content hover:text-white font-medium py-4 px-10 rounded-full border border-base-300 hover:border-brand-primary/50 hover:bg-white/5 transition-all duration-300"
        >
            Learn More
        </a>
      </div>
    </div>
  </div>
);

// Feature Card Component
const FeatureCard: React.FC<{
  icon: React.ComponentType<{ className: string }>;
  title: string;
  description: string;
}> = ({ icon: Icon, title, description }) => (
  <div className="bg-base-200/40 p-8 rounded-2xl border border-base-300/50 backdrop-blur-md transition-all duration-300 hover:border-brand-primary/30 hover:bg-base-200/60 hover:-translate-y-1 group">
    <div className="inline-block p-4 bg-base-300/50 rounded-xl mb-6 group-hover:bg-brand-primary/10 transition-colors">
      <Icon className="w-8 h-8 text-brand-primary" />
    </div>
    <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
    <p className="text-content-muted leading-relaxed">{description}</p>
  </div>
);

export const HomePage: React.FC = () => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % CAROUSEL_ITEMS.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) => (prev - 1 + CAROUSEL_ITEMS.length) % CAROUSEL_ITEMS.length);
    };

    // --- REMOVED: Automatic useEffect interval ---
    
  return (
    <div className="flex flex-col min-h-screen font-sans bg-base-100 text-content antialiased selection:bg-brand-primary selection:text-black">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 flex items-center p-6 z-20">
        <div className="flex items-center gap-2">
            <CubeIcon className="w-8 h-8 text-brand-primary" />
            <h1 className="text-xl font-bold tracking-wider text-content">
            Sketch-to-3D <span className="text-brand-primary font-bold">Mesh AI</span>
            </h1>
        </div>
        <div className="ml-auto flex items-center gap-6">
          <Link to="/workspace" className="text-sm font-medium text-content-muted hover:text-white transition-colors hidden sm:block">
            Sign In
          </Link>
          <Link
            to="/workspace"
            className="bg-white/10 hover:bg-white/20 text-white font-semibold py-2 px-6 rounded-full text-sm transition-all duration-300 backdrop-blur-md border border-white/10"
          >
            Launch App
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Hero />

        {/* Features Section */}
        <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-32 relative">
            {/* Decorative glowing orb behind features */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-brand-primary/5 rounded-full blur-[120px] pointer-events-none"></div>
            
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-content-muted max-w-xl mx-auto">
                Three simple steps to transform your imagination into reality.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 relative z-10">
            <FeatureCard
              icon={PencilIcon}
              title="1. Sketch"
              description="Use our drawing canvas to create a sketch, or simply upload any 2D line art directly from your device."
            />
            <FeatureCard
              icon={SparklesIcon}
              title="2. Generate"
              description="Our 2-Stage AI converts your sketch into a photorealistic image, then builds a complex 3D mesh."
            />
            <FeatureCard
              icon={VrIcon}
              title="3. Export"
              description="View your model in the interactive 3D viewer. Check quality variations and export as .OBJ or .STL."
            />
          </div>
        </section>

        {/* 2D to 3D Showcase Section with Carousel */}
        <section className="max-w-7xl mx-auto px-6 py-20 mb-20">
          <div className="bg-base-200/30 border border-base-300/50 rounded-3xl p-8 md:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-full h-full bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
            
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold mb-4">From 2D to 3D in Seconds</h2>
                <p className="text-content-muted">See the transformation happen.</p>
            </div>

            {/* Carousel Container */}
            <div className="relative z-10">
                <div className="grid md:grid-cols-2 gap-12 items-center min-h-[400px]"> 
                    {/* Sketch Input Card */}
                    <div className="relative group overflow-hidden rounded-xl animate-fade-in-fast">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-6 bg-base-100 rounded-xl border border-base-300/50 flex flex-col items-center h-full">
                            <p className="font-mono text-xs text-brand-primary mb-4 tracking-widest">INPUT SKETCH</p>
                            <img
                                src={CAROUSEL_ITEMS[currentSlide].sketch}
                                alt="Input sketch"
                                className="w-full h-64 object-contain bg-white rounded-lg transition-opacity duration-500"
                            />
                             <p className="mt-4 text-sm text-content-muted text-center italic">{CAROUSEL_ITEMS[currentSlide].prompt}</p>
                        </div>
                    </div>

                    {/* Separator for mobile */}
                    <div className="flex items-center justify-center md:hidden text-content-muted">
                        <span className="rotate-90 text-2xl">↓</span>
                    </div>

                    {/* Generated 3D Model Card */}
                    <div className="relative group overflow-hidden rounded-xl animate-fade-in-fast">
                        <div className="absolute -inset-1 bg-gradient-to-r from-brand-primary to-emerald-600 rounded-xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
                        <div className="relative p-2 md:p-4 bg-base-100 rounded-xl border border-base-300/50 flex flex-col items-center h-full">
                            <p className="font-mono text-xs text-brand-primary mb-2 tracking-widest">GENERATED 3D MODEL</p>
                            <div className="w-full h-80 bg-black rounded-lg overflow-hidden">
                                <Display3DModel key={currentSlide} modelPath={CAROUSEL_ITEMS[currentSlide].model} />
                            </div>
                            <p className="mt-4 text-sm text-content-muted text-center italic">Interact with the 3D model!</p>
                        </div>
                    </div>
                </div>

                {/* Carousel Navigation */}
                <button
                    onClick={prevSlide}
                    className="absolute top-1/2 left-0 md:-left-12 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/10 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 z-20"
                    aria-label="Previous slide"
                >
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>
                <button
                    onClick={nextSlide}
                    className="absolute top-1/2 right-0 md:-right-12 transform -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full backdrop-blur-md border border-white/10 text-white transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-primary/50 z-20"
                    aria-label="Next slide"
                >
                    <ChevronRightIcon className="w-6 h-6" />
                </button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-8 border-t border-base-300/50 bg-base-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-content-muted">
          <p>&copy; {new Date().getFullYear()} Sketch-to-3D Mesh AI.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
};