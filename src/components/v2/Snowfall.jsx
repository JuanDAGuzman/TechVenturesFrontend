export default function Snowfall() {
    const snowflakes = Array.from({ length: 30 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100 + "%",
        animationDuration: Math.random() * 10 + 10 + "s",
        animationDelay: Math.random() * 10 + "s",
        fontSize: Math.random() * 0.5 + 0.2 + "rem",
    }));

    return (
        <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
            <style>
                {`
          @keyframes snowfall {
            0% { transform: translateY(-10vh) translateX(0) rotate(0deg); opacity: 0.8; }
            100% { transform: translateY(110vh) translateX(20px) rotate(360deg); opacity: 0.3; }
          }
        `}
            </style>
            {snowflakes.map((flake) => (
                <div
                    key={flake.id}
                    className="absolute top-0 text-blue-200/60"
                    style={{
                        left: flake.left,
                        fontSize: flake.fontSize,
                        animation: `snowfall ${flake.animationDuration} linear infinite`,
                        animationDelay: flake.animationDelay,
                    }}
                >
                    ❄
                </div>
            ))}
        </div>
    );
}
