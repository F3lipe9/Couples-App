import React from 'react';
import { Loader2 } from 'lucide-react';

interface ButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  className?: string;
  isLoading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({ 
  children = null, 
  onClick = undefined, 
  variant = 'primary', 
  className = '', 
  isLoading = false, 
  disabled = false, 
  type = 'button' 
}) => {
  const baseStyle = "w-full py-3 px-4 rounded-xl font-medium transition-all duration-200 flex items-center justify-center gap-2 active:scale-95";
  const variants = {
    primary: "bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-200",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50",
    outline: "border-2 border-rose-500 text-rose-500 hover:bg-rose-50",
    ghost: "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
  };

  return (
    <button 
      type={type}
      onClick={onClick} 
      disabled={disabled || isLoading}
      className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : children}
    </button>
  );
};