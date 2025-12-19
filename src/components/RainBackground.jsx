import React, { useRef, useEffect, useCallback } from 'react';

const RainBackground = () => {
    const canvasRef = useRef(null);
    const animationRef = useRef(0);
    const raindropsRef = useRef([]);

    const initRaindrops = useCallback((width, height) => {
        const drops = [];
        const dropCount = Math.floor((width * height) / 8000);

        for (let i = 0; i < dropCount; i++) {
            drops.push({
                x: Math.random() * width,
                y: Math.random() * height,
                length: 15 + Math.random() * 25,
                speed: 1 + Math.random() * 2,
                opacity: 0.1 + Math.random() * 0.3,
                width: 1 + Math.random() * 1.5
            });
        }

        raindropsRef.current = drops;
    }, []);

    const animate = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        raindropsRef.current.forEach(drop => {
            drop.y += drop.speed;

            if (drop.y > height) {
                drop.y = -drop.length;
                drop.x = Math.random() * width;
            }

            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x, drop.y + drop.length);

            const gradient = ctx.createLinearGradient(drop.x, drop.y, drop.x, drop.y + drop.length);
            gradient.addColorStop(0, `rgba(100, 180, 255, 0)`);
            gradient.addColorStop(0.5, `rgba(150, 200, 255, ${drop.opacity})`);
            gradient.addColorStop(1, `rgba(200, 220, 255, ${drop.opacity * 0.5})`);

            ctx.strokeStyle = gradient;
            ctx.lineWidth = drop.width;
            ctx.lineCap = 'round';
            ctx.stroke();
        });

        animationRef.current = requestAnimationFrame(animate);
    }, []);

    const handleResize = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        const width = window.innerWidth;
        const height = window.innerHeight;

        canvas.width = width * dpr;
        canvas.height = height * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.scale(dpr, dpr);
        }

        initRaindrops(width, height);
    }, [initRaindrops]);

    useEffect(() => {
        handleResize();
        window.addEventListener('resize', handleResize);
        animationRef.current = requestAnimationFrame(animate);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(animationRef.current);
        };
    }, [handleResize, animate]);

    return (
        <>
            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'linear-gradient(180deg, #0a0a1a 0%, #0f0f24 50%, #0a0a1a 100%)',
                    zIndex: -10
                }}
            />

            <canvas
                ref={canvasRef}
                className="fixed inset-0 pointer-events-none"
                style={{ zIndex: 1 }}
            />

            <div
                className="fixed inset-0 pointer-events-none"
                style={{
                    background: 'radial-gradient(ellipse at 50% 0%, rgba(100, 150, 200, 0.05) 0%, transparent 60%)',
                    zIndex: 0
                }}
            />
        </>
    );
};

export default RainBackground;
