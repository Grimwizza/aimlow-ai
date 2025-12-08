import React from 'react';
import { Icon } from './Icon';

const variants = {
    primary: "bg-black text-white hover:bg-blue-600 border-2 border-transparent",
    secondary: "bg-white text-black border-2 border-black hover:bg-gray-100 brutal-shadow",
    ghost: "bg-transparent text-black hover:text-blue-600",
    outline: "bg-transparent text-black border-2 border-black hover:bg-black hover:text-white"
};

const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg"
};

export const Button = ({
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    icon,
    className = "",
    disabled,
    ...props
}) => {
    return (
        <button
            disabled={disabled || isLoading}
            className={`
                font-bold uppercase transition-all flex items-center justify-center gap-2
                ${variants[variant]} 
                ${sizes[size]} 
                ${isLoading || disabled ? 'opacity-70 cursor-not-allowed' : ''}
                ${className}
            `}
            {...props}
        >
            {isLoading ? <Icon name="loader" className="animate-spin" size={size === 'sm' ? 16 : 20} /> : icon && <Icon name={icon} size={size === 'sm' ? 16 : 20} />}
            {children}
        </button>
    );
};
