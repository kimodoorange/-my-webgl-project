import React, { useState, useEffect } from 'react';

const RandomTextResolver = () => {
    const [displayText, setDisplayText] = useState('');
    const finalText = 'KIMODOORANGE';
    const animationDuration = 3140; // 3.14 seconds

    // Generate a random uppercase letter
    const getRandomLetter = () => {
        return String.fromCharCode(65 + Math.floor(Math.random() * 26));
    };

    useEffect(() => {
        // Initial random letter generation
        const intervalId = setInterval(() => {
            // Generate a string of random letters matching the length of final text
            const randomLetters = Array(finalText.length)
                .fill(0)
                .map(getRandomLetter)
                .join('');
            
            setDisplayText(randomLetters);
        }, 50); // Update very quickly to create a flickering effect

        // Stop random generation and resolve to final text after duration
        const timeoutId = setTimeout(() => {
            clearInterval(intervalId);
            setDisplayText(finalText);
        }, animationDuration);

        // Cleanup
        return () => {
            clearInterval(intervalId);
            clearTimeout(timeoutId);
        };
    }, []);

    return (
        <div 
            className="text-center text-white text-6xl font-bold tracking-widest 
                       absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                       z-20 select-none"
        >
            {displayText}
        </div>
    );
};

export default RandomTextResolver;
