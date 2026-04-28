import React from 'react';

// Custom SVG Logo — wheat stalk with handshake
// Agriculture-themed, no external deps, copyright-free
const Logo = ({ size = 40, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Background circle */}
    <circle cx="32" cy="32" r="30" fill="#166534" />

    {/* Wheat stalk - center stem */}
    <path d="M32 52V20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />

    {/* Wheat grains - left */}
    <ellipse cx="27" cy="22" rx="5" ry="3" transform="rotate(-30 27 22)" fill="#F59E0B" opacity="0.9" />
    <ellipse cx="27" cy="28" rx="5" ry="3" transform="rotate(-30 27 28)" fill="#F59E0B" opacity="0.8" />
    <ellipse cx="28" cy="34" rx="4.5" ry="2.5" transform="rotate(-20 28 34)" fill="#F59E0B" opacity="0.7" />

    {/* Wheat grains - right */}
    <ellipse cx="37" cy="22" rx="5" ry="3" transform="rotate(30 37 22)" fill="#F59E0B" opacity="0.9" />
    <ellipse cx="37" cy="28" rx="5" ry="3" transform="rotate(30 37 28)" fill="#F59E0B" opacity="0.8" />
    <ellipse cx="36" cy="34" rx="4.5" ry="2.5" transform="rotate(20 36 34)" fill="#F59E0B" opacity="0.7" />

    {/* Top grain */}
    <ellipse cx="32" cy="17" rx="3" ry="5" fill="#F59E0B" />

    {/* Handshake at bottom */}
    <path
      d="M20 46C20 46 24 42 28 44C30 45 30 47 32 47C34 47 34 45 36 44C40 42 44 46 44 46"
      stroke="white"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Left hand */}
    <path d="M16 48L20 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
    {/* Right hand */}
    <path d="M48 48L44 46" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

export default Logo;
