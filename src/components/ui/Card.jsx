import React from 'react';

export const Card = ({ children, className = "", color = "bg-white", noShadow = false, ...props }) => {
    return (
        <div
            className={`
                border-2 border-black p-6 
                ${color} 
                ${!noShadow ? 'brutal-shadow' : ''} 
                ${className}
            `}
            {...props}
        >
            {children}
        </div>
    );
};
