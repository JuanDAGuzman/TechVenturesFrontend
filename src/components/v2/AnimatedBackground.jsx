import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";

export default function AnimatedBackground() {
    const containerRef = useRef(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    });

    // Parallax effects for background elements
    const y1 = useTransform(scrollYProgress, [0, 1], [0, 300]);
    const y2 = useTransform(scrollYProgress, [0, 1], [0, -300]);
    const rotate = useTransform(scrollYProgress, [0, 1], [0, 45]);

    return (
        <div ref={containerRef} className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
            {/* Base Background */}
            <div className="absolute inset-0 bg-slate-50" />

            {/* Subtle Grid Pattern */}
            <div
                className="absolute inset-0 opacity-[0.03]"
                style={{
                    backgroundImage: 'linear-gradient(#1F2937 1px, transparent 1px), linear-gradient(90deg, #1F2937 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}
            />

            {/* Animated Orbs/Spotlights */}
            <motion.div
                style={{ y: y1, rotate }}
                className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-christmas-red/5 rounded-full blur-[100px]"
            />

            <motion.div
                style={{ y: y2 }}
                className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-christmas-green/5 rounded-full blur-[100px]"
            />

            <motion.div
                animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                transition={{ duration: 8, repeat: Infinity }}
                className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-christmas-gold/5 rounded-full blur-[80px]"
            />
        </div>
    );
}
