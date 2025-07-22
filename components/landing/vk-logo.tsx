"use client";

import React, { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Sparkles } from "lucide-react";

interface VKLogoProps {
  className?: string;
  size?: "xs" | "sm" | "default" | "lg" | "xl";
  animated?: boolean;
  interactive?: boolean;
  showGlow?: boolean;
}

export function VKLogo({ 
  className, 
  size = "default", 
  animated = true,
  interactive = true,
  showGlow = true
}: VKLogoProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const sizeClasses = {
    xs: "h-4 w-4",
    sm: "h-6 w-6",
    default: "h-8 w-8",
    lg: "h-10 w-10",
    xl: "h-12 w-12"
  };

  const iconSizes = {
    xs: "w-2.5 h-2.5",
    sm: "w-3.5 h-3.5",
    default: "w-5 h-5",
    lg: "w-6 h-6",
    xl: "w-7 h-7"
  };

  useEffect(() => {
    // Simulate loading for animation effect
    const timer = setTimeout(() => setIsLoaded(true), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className={cn(
        "relative group cursor-pointer transition-all duration-500",
        sizeClasses[size],
        className
      )}
      onMouseEnter={() => interactive && setIsHovered(true)}
      onMouseLeave={() => interactive && setIsHovered(false)}
    >
      {/* Animated background glow */}
      {showGlow && (
        <div className={cn(
          "absolute inset-0 rounded-xl transition-all duration-700",
          animated && isLoaded ? "opacity-100" : "opacity-0",
          isHovered ? "scale-125 opacity-100" : "scale-100 opacity-60"
        )}>
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/30 via-purple-500/30 to-pink-500/30 rounded-xl blur-md animate-pulse" />
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/20 via-violet-400/20 to-fuchsia-400/20 rounded-xl blur-lg animate-pulse delay-300" />
        </div>
      )}
      
      {/* Main logo container */}
      <div className={cn(
        "relative flex items-center justify-center rounded-xl transition-all duration-500",
        "bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600",
        "shadow-lg shadow-purple-500/25",
        animated && isLoaded ? "scale-100 opacity-100" : "scale-95 opacity-0",
        isHovered ? "scale-110 shadow-xl shadow-purple-500/40 rotate-3" : "scale-100 rotate-0"
      )}>
        {/* Enhanced SVG Logo using the actual gradient paths */}
        <svg
          viewBox="0 0 165.35 95.93"
          className={cn(
            "transition-all duration-500",
            iconSizes[size],
            isHovered ? "drop-shadow-lg" : "drop-shadow-sm"
          )}
          fill="none"
        >
          <defs>
            {/* Multiple gradients for enhanced visual effect */}
            <linearGradient id="vk-primary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="30%" stopColor="#f0f9ff" stopOpacity="1" />
              <stop offset="70%" stopColor="#e0e7ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.9" />
            </linearGradient>
            
            <linearGradient id="vk-secondary" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#faf5ff" stopOpacity="1" />
              <stop offset="100%" stopColor="#f3e8ff" stopOpacity="0.95" />
            </linearGradient>

            {/* Animated gradient for hover effect */}
            <linearGradient id="vk-animated" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1">
                {isHovered && (
                  <animate
                    attributeName="stop-opacity"
                    values="1;0.8;1"
                    dur="2s"
                    repeatCount="indefinite"
                  />
                )}
              </stop>
              <stop offset="50%" stopColor="#f8fafc" stopOpacity="1">
                {isHovered && (
                  <animate
                    attributeName="stop-opacity"
                    values="1;0.9;1"
                    dur="2s"
                    repeatCount="indefinite"
                    begin="0.5s"
                  />
                )}
              </stop>
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.95">
                {isHovered && (
                  <animate
                    attributeName="stop-opacity"
                    values="0.95;0.7;0.95"
                    dur="2s"
                    repeatCount="indefinite"
                    begin="1s"
                  />
                )}
              </stop>
            </linearGradient>

            {/* Filter effects */}
            <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          
          {/* Main VK paths from the original SVG */}
          <g transform="translate(-25.14,-106.06)">
            {/* First path - V shape */}
            <path
              d="m 89.125,201.206 c -0.216,-0.099 -0.061,-0.612 0.497,-1.649 0.446,-0.828 2.775,-4.839 5.176,-8.914 2.401,-4.075 4.813,-8.123 5.361,-8.996 0.547,-0.873 1.799,-2.957 2.783,-4.63 0.983,-1.673 3.036,-5.126 4.561,-7.673 1.525,-2.547 3.958,-6.654 5.407,-9.128 1.449,-2.474 3.125,-5.331 3.725,-6.35 0.827,-1.403 2.856,-3.648 8.373,-9.26 4.005,-4.075 12.115,-12.29 18.023,-18.256 5.908,-5.966 12.34,-12.467 14.293,-14.446 l 3.551,-3.598 1.72,-0.827 1.72,-0.827 13.036,-0.073 c 9.867,-0.056 12.935,0 12.62,0.231 -0.236,0.172 -0.296,0.344 -0.138,0.397 0.153,0.051 -1.597,2.001 -3.889,4.334 -2.292,2.333 -7.202,7.393 -10.913,11.245 -3.711,3.852 -10.033,10.337 -14.049,14.412 -4.016,4.075 -9.077,9.232 -11.245,11.461 -2.169,2.229 -4.099,4.348 -4.289,4.71 l -0.347,0.658 0.319,0.967 c 0.222,0.673 1.976,2.704 5.771,6.684 2.998,3.144 7.416,7.841 9.817,10.437 2.401,2.596 5.305,5.744 6.452,6.995 1.148,1.251 3.113,3.346 4.367,4.656 1.254,1.31 2.93,3.096 3.725,3.969 0.795,0.873 3.295,3.542 5.555,5.93 2.261,2.388 4.787,5.034 5.613,5.878 l 1.503,1.536 -0.842,0.157 c -0.463,0.086 -7.092,0.12 -14.732,0.075 l -13.891,-0.082 -1.67,-0.906 c -0.919,-0.498 -2.052,-1.272 -2.518,-1.72 -0.466,-0.448 -2.448,-2.541 -4.404,-4.651 -1.956,-2.11 -4.889,-5.206 -6.517,-6.879 -1.628,-1.673 -3.405,-3.519 -3.948,-4.101 -0.543,-0.582 -2.729,-2.962 -4.856,-5.289 -2.128,-2.327 -4.803,-5.204 -5.945,-6.395 -1.142,-1.191 -2.439,-2.315 -2.882,-2.498 l -0.806,-0.334 -0.941,0.511 c -0.517,0.281 -1.266,1.047 -1.664,1.702 -0.398,0.655 -1.64,2.738 -2.762,4.63 -1.121,1.892 -3.103,5.285 -4.404,7.541 -1.301,2.256 -3.804,6.508 -5.564,9.451 -1.759,2.942 -3.685,5.842 -4.28,6.444 -0.595,0.602 -1.676,1.401 -2.404,1.775 l -1.323,0.681 -6.218,0.081 c -3.42,0.045 -6.359,0.016 -6.531,-0.063 z"
              fill={isHovered ? "url(#vk-animated)" : "url(#vk-primary)"}
              filter={isHovered ? "url(#glow)" : undefined}
              className="transition-all duration-500"
            />
            
            {/* Second path - K shape */}
            <path
              d="m 78.143,199.453 c -0.356,-0.739 -1.24,-2.356 -1.964,-3.593 -0.725,-1.237 -3.797,-6.573 -6.828,-11.858 -3.031,-5.285 -5.51,-9.655 -5.51,-9.712 0,-0.057 -0.375,-0.733 -0.833,-1.504 -0.458,-0.77 -1.194,-2.056 -1.636,-2.856 -0.442,-0.8 -1.87,-3.241 -3.173,-5.424 -1.304,-2.183 -2.579,-4.326 -2.835,-4.763 -0.255,-0.437 -3.406,-5.913 -7.001,-12.171 -3.595,-6.257 -7.582,-13.223 -8.86,-15.478 -1.278,-2.256 -3.603,-6.304 -5.168,-8.996 -1.565,-2.692 -3.467,-5.966 -4.227,-7.276 -0.76,-1.31 -1.679,-2.917 -2.043,-3.572 -0.364,-0.655 -0.935,-1.667 -1.27,-2.249 -0.334,-0.582 -0.751,-1.327 -0.926,-1.656 -0.175,-0.328 -0.267,-0.864 -0.205,-1.191 l 0.113,-0.593 13.674,0.132 13.674,0.132 0.926,0.429 c 0.509,0.236 1.525,0.876 2.256,1.423 0.731,0.547 1.879,1.723 2.551,2.614 0.671,0.891 1.473,2.096 1.782,2.678 0.309,0.582 0.887,1.618 1.286,2.302 0.399,0.684 3.517,6.102 6.929,12.039 3.412,5.937 6.597,11.414 7.078,12.171 0.48,0.757 0.873,1.439 0.873,1.516 0,0.077 0.434,0.827 0.964,1.666 0.53,0.84 1.429,2.254 1.998,3.144 0.568,0.889 1.308,1.742 1.644,1.895 0.44,0.2 0.788,0.19 1.243,-0.037 0.348,-0.173 1.122,-1.061 1.719,-1.974 0.597,-0.912 1.25,-1.981 1.45,-2.374 0.2,-0.394 2.02,-3.692 4.044,-7.33 2.024,-3.638 4.391,-7.924 5.261,-9.525 0.87,-1.601 3.324,-6.006 5.453,-9.79 l 3.872,-6.879 1.593,-1.588 c 1.092,-1.088 2.008,-1.734 2.91,-2.052 l 1.317,-0.464 12.12,0.001 c 7.413,0.001 12.061,0.097 11.968,0.248 -0.084,0.135 -0.031,0.321 0.118,0.413 0.164,0.101 0.022,0.499 -0.361,1.01 -0.347,0.464 -0.827,1.201 -1.066,1.637 -0.239,0.437 -0.7,1.224 -1.023,1.749 -0.324,0.526 -1.779,3.003 -3.234,5.505 -1.455,2.502 -2.838,4.87 -3.073,5.262 -0.235,0.392 -1.435,2.379 -2.666,4.417 -1.231,2.037 -2.682,4.478 -3.224,5.424 -0.542,0.946 -1.947,3.327 -3.122,5.292 -1.175,1.965 -3.291,5.536 -4.704,7.938 -1.412,2.401 -3.336,5.653 -4.767,8.07 -1.431,2.417 -2.926,4.932 -3.815,6.433 -0.889,1.501 -2.092,3.531 -2.675,4.512 -0.582,0.981 -1.99,3.384 -3.129,5.341 -1.139,1.957 -3.029,5.165 -4.201,7.13 -1.172,1.965 -2.903,4.882 -3.847,6.482 -0.944,1.601 -1.923,3.268 -2.175,3.704 -0.253,0.437 -0.947,1.568 -1.544,2.514 -0.596,0.946 -1.834,3.007 -2.752,4.579 -0.917,1.573 -1.876,3.18 -2.131,3.572 -0.255,0.392 -0.633,1.069 -0.841,1.506 -0.207,0.437 -0.594,0.922 -0.859,1.08 l -0.482,0.286 z"
              fill={isHovered ? "url(#vk-animated)" : "url(#vk-secondary)"}
              filter={isHovered ? "url(#glow)" : undefined}
              className="transition-all duration-500"
            />
          </g>
        </svg>
        
        {/* Animated sparkle effects */}
        {animated && isHovered && (
          <div className="absolute inset-0 pointer-events-none">
            <Sparkles className="absolute top-0 right-0 w-2 h-2 text-white/70 animate-pulse" />
            <Sparkles className="absolute bottom-0 left-0 w-1.5 h-1.5 text-white/50 animate-pulse delay-300" />
            <Sparkles className="absolute top-1/2 left-1/2 w-1 h-1 text-white/60 animate-pulse delay-700 -translate-x-1/2 -translate-y-1/2" />
          </div>
        )}

        {/* Rotating border effect */}
        {animated && isHovered && (
          <div className="absolute inset-0 rounded-xl border border-white/20 animate-spin" style={{ animationDuration: '3s' }} />
        )}
      </div>

      {/* Loading animation overlay */}
      {animated && !isLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl animate-pulse" />
      )}
    </div>
  );
}

// Preset variations for common use cases
export function VKLogoMini(props: Omit<VKLogoProps, 'size'>) {
  return <VKLogo {...props} size="xs" />;
}

export function VKLogoSmall(props: Omit<VKLogoProps, 'size'>) {
  return <VKLogo {...props} size="sm" />;
}

export function VKLogoLarge(props: Omit<VKLogoProps, 'size'>) {
  return <VKLogo {...props} size="lg" />;
}

export function VKLogoXL(props: Omit<VKLogoProps, 'size'>) {
  return <VKLogo {...props} size="xl" />;
}

// Static version for performance-critical areas
export function VKLogoStatic({ className, size = "default" }: Pick<VKLogoProps, 'className' | 'size'>) {
  return (
    <VKLogo 
      className={className}
      size={size}
      animated={false}
      interactive={false}
      showGlow={false}
    />
  );
}