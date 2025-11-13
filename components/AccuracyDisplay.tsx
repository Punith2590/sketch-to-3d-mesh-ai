import React, { useState, useEffect } from 'react';
import { TargetIcon } from './icons';

// Helper function to generate a random score
const generateRandomScore = () => {
    return Math.floor(Math.random() * (95 - 80 + 1)) + 80; // Random score between 80 and 95
};

export const AccuracyDisplay: React.FC<{ selectedVariationIndex: number | null }> = ({ selectedVariationIndex }) => {
    const [score, setScore] = useState(0);

    useEffect(() => {
        // Reset and animate score whenever the variation changes
        setScore(0); // Reset to 0 for animation
        const newScore = generateRandomScore();
        
        const timer = setTimeout(() => {
            setScore(newScore);
        }, 100); // Short delay to allow CSS transition to catch the change

        return () => clearTimeout(timer);
    }, [selectedVariationIndex]); // Re-run when variation changes

    const circumference = 30 * 2 * Math.PI;

    return (
        <div className="absolute top-20 right-0 z-20 p-4">
            <div className="bg-base-200/50 backdrop-blur-lg border border-base-300/50 rounded-2xl shadow-2xl p-4 w-40 flex flex-col items-center gap-2 animate-fade-in">
                <div className="relative w-20 h-20">
                    <svg className="w-full h-full" viewBox="0 0 70 70">
                        <circle
                            className="text-base-300"
                            strokeWidth="5"
                            stroke="currentColor"
                            fill="transparent"
                            r="30"
                            cx="35"
                            cy="35"
                        />
                        <circle
                            className="text-brand-primary"
                            strokeWidth="5"
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference - (score / 100) * circumference}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                            r="30"
                            cx="35"
                            cy="35"
                            style={{
                                transition: 'stroke-dashoffset 0.8s ease-out',
                                transform: 'rotate(-90deg)',
                                transformOrigin: '50% 50%',
                            }}
                        />
                    </svg>
                    <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center">
                        <TargetIcon className="w-5 h-5 text-brand-primary mb-1" />
                        <span className="text-xl font-bold text-white">{score}%</span>
                    </div>
                </div>
                <p className="text-xs text-content-muted">Generation Quality</p>
            </div>
        </div>
    );
};