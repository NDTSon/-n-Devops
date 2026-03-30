/**
 * Spinner.jsx  —  Hiệu ứng loading vui mắt, thay thế vòng tròn nhàm chán
 *
 * Variants:
 *  - "dots"   (default) : 3 chấm nảy lên xuống
 *  - "bars"             : 5 thanh nhịp nhạc
 *  - "pulse"            : logo BookOpen đập tim
 *  - "orbit"            : 3 vòng tròn quay quanh nhau (đẹp nhất cho full-page)
 *
 * Size: "sm" | "md" | "lg"
 */
import React from 'react';
import { BookOpen } from 'lucide-react';

// ─── Dots ────────────────────────────────────────────────────────────────────
const DotsSpinner = ({ size }) => {
    const sz = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-4 h-4' : 'w-3 h-3';
    return (
        <div className="flex items-center gap-1.5">
            {[0, 1, 2].map((i) => (
                <span
                    key={i}
                    className={`${sz} rounded-full bg-primary-500 inline-block`}
                    style={{
                        animation: 'dotBounce 1.2s ease-in-out infinite',
                        animationDelay: `${i * 0.2}s`,
                    }}
                />
            ))}
        </div>
    );
};

// ─── Bars (music equalizer) ───────────────────────────────────────────────────
const BarsSpinner = ({ size }) => {
    const h = size === 'sm' ? 20 : size === 'lg' ? 40 : 28;
    const w = size === 'sm' ? 3 : size === 'lg' ? 6 : 4;
    const heights = [0.4, 0.7, 1, 0.7, 0.4];
    return (
        <div className="flex items-end gap-0.5" style={{ height: h }}>
            {heights.map((ratio, i) => (
                <span
                    key={i}
                    className="rounded-sm bg-gradient-to-t from-primary-600 to-sky-400 inline-block"
                    style={{
                        width: w,
                        height: h * ratio,
                        animation: 'barPulse 1s ease-in-out infinite alternate',
                        animationDelay: `${i * 0.12}s`,
                    }}
                />
            ))}
        </div>
    );
};

// ─── Pulse (BookOpen heartbeat) ───────────────────────────────────────────────
const PulseSpinner = ({ size }) => {
    const iconSz = size === 'sm' ? 'h-8 w-8' : size === 'lg' ? 'h-16 w-16' : 'h-12 w-12';
    const ringSz = size === 'sm' ? 'h-14 w-14' : size === 'lg' ? 'h-28 w-28' : 'h-20 w-20';
    return (
        <div className="relative flex items-center justify-center">
            {/* Ripple rings */}
            {[0, 1].map((i) => (
                <span
                    key={i}
                    className={`absolute ${ringSz} rounded-full border-2 border-primary-400 opacity-0`}
                    style={{
                        animation: 'ripple 2s ease-out infinite',
                        animationDelay: `${i * 0.7}s`,
                    }}
                />
            ))}
            <BookOpen
                className={`${iconSz} text-primary-600`}
                style={{ animation: 'heartbeat 1.4s ease-in-out infinite' }}
            />
        </div>
    );
};

// ─── Orbit (3 balls orbiting) ─────────────────────────────────────────────────
const OrbitSpinner = ({ size }) => {
    const container = size === 'sm' ? 48 : size === 'lg' ? 96 : 64;
    const dotSize = size === 'sm' ? 8 : size === 'lg' ? 14 : 10;
    const radius = (container - dotSize) / 2;
    const colors = ['bg-sky-400', 'bg-primary-500', 'bg-violet-500'];
    return (
        <div
            className="relative flex items-center justify-center"
            style={{ width: container, height: container }}
        >
            {/* Center glow */}
            <span
                className="absolute rounded-full bg-primary-200 opacity-30"
                style={{
                    width: container * 0.35,
                    height: container * 0.35,
                    animation: 'glowPulse 2s ease-in-out infinite',
                }}
            />
            {colors.map((color, i) => (
                <span
                    key={i}
                    className={`absolute rounded-full ${color} shadow-sm`}
                    style={{
                        width: dotSize,
                        height: dotSize,
                        transformOrigin: `${-radius + dotSize / 2}px 0`,
                        animation: 'orbit 1.6s linear infinite',
                        animationDelay: `${-(i * (1.6 / colors.length))}s`,
                        left: `calc(50% - ${dotSize / 2}px)`,
                        top: `calc(50% - ${dotSize / 2}px)`,
                    }}
                />
            ))}
        </div>
    );
};

// ─── Main export ──────────────────────────────────────────────────────────────
/**
 * @param {'dots'|'bars'|'pulse'|'orbit'} variant
 * @param {'sm'|'md'|'lg'} size
 * @param {string} label  — text hiện bên dưới (optional)
 * @param {string} className — wrapper class
 */
const Spinner = ({
    variant = 'orbit',
    size = 'md',
    label,
    className = '',
}) => {
    const map = { dots: DotsSpinner, bars: BarsSpinner, pulse: PulseSpinner, orbit: OrbitSpinner };
    const Inner = map[variant] || OrbitSpinner;

    return (
        <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
            <Inner size={size} />
            {label && (
                <p className="text-sm font-medium text-slate-500 animate-pulse">{label}</p>
            )}
        </div>
    );
};

export default Spinner;
