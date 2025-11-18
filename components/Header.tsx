import React from 'react';
import { CubeIcon, LockIcon } from './icons'; // <-- Add LockIcon
import type { User } from 'firebase/auth'; // <-- Import User type

interface HeaderProps {
  currentUser: User | null; // <-- Prop for the user
  onSignOut: () => void; // <-- Prop for the sign out function
}

export const Header: React.FC<HeaderProps> = ({ currentUser, onSignOut }) => {
  return (
    <header className="absolute top-0 left-0 right-0 flex items-center p-4 bg-base-100/50 backdrop-blur-sm z-20 border-b border-base-300/50">
      <CubeIcon className="w-7 h-7 text-brand-primary" />
      <h1 className="ml-3 text-xl font-bold tracking-wider text-content">
        Sketch-to-3D <span className="text-brand-primary font-bold">Mesh AI</span>
      </h1>

      {/* --- NEW SIGN OUT SECTION --- */}
      {currentUser && (
        <div className="ml-auto flex items-center gap-4">
          <span className="text-sm text-content-muted hidden sm:block">
            {currentUser.email}
          </span>
          <button
            onClick={onSignOut}
            title="Sign Out"
            className="flex items-center gap-2 text-content-muted hover:text-red-400 transition-colors bg-base-300/50 hover:bg-base-300 px-3 py-2 rounded-lg"
          >
            <LockIcon className="w-5 h-5" />
            <span className="text-sm font-semibold hidden md:block">Sign Out</span>
          </button>
        </div>
      )}
      {/* --- END NEW SECTION --- */}
    </header>
  );
};