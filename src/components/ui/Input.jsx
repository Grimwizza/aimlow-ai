import React, { forwardRef } from 'react';
import { Icon } from './Icon';

export const Input = forwardRef(({ icon, className = "", ...props }, ref) => {
    return (
        <div className="relative w-full">
            {icon && (
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                    <Icon name={icon} size={20} />
                </div>
            )}
            <input
                ref={ref}
                className={`
                    w-full bg-white border-2 border-black 
                    py-3 ${icon ? 'pl-10' : 'pl-4'} pr-4 
                    font-bold text-lg 
                    focus:outline-none focus:bg-yellow-50 
                    transition-colors 
                    placeholder:text-gray-400
                    ${className}
                `}
                {...props}
            />
        </div>
    );
});

Input.displayName = "Input";
