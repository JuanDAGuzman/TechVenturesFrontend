import { motion } from "framer-motion";

const SocialCard = ({ href, icon, label, description, color, delay }) => {
    return (
        <motion.a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex flex-col items-center justify-center p-4 rounded-xl bg-white shadow-md border border-slate-100 hover:shadow-lg transition-all duration-300 group cursor-pointer relative overflow-hidden h-full`}
        >
            <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 ${color}`}></div>
            <div className="w-12 h-12 mb-2 flex items-center justify-center">
                {icon}
            </div>
            <span className="font-bold text-base text-slate-800 group-hover:text-slate-900 transition-colors">
                {label}
            </span>
            <span className="text-xs text-slate-500 mt-1 font-medium text-center px-2">
                {description}
            </span>
            <span className="text-xs text-christmas-red mt-2 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Contactar
            </span>
        </motion.a>
    );
};

// Brand Icons as Components
const WhatsAppIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#25D366]" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
);

const InstagramIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="ig-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#833AB4" />
                <stop offset="50%" stopColor="#FD1D1D" />
                <stop offset="100%" stopColor="#F77737" />
            </linearGradient>
        </defs>
        <path fill="url(#ig-gradient)" d="M7.8,2H16.2C19.4,2 22,4.6 22,7.8V16.2A5.8,5.8 0 0,1 16.2,22H7.8C4.6,22 2,19.4 2,16.2V7.8A5.8,5.8 0 0,1 7.8,2M7.6,4A3.6,3.6 0 0,0 4,7.6V16.4C4,18.39 5.61,20 7.6,20H16.4A3.6,3.6 0 0,0 20,16.4V7.6C20,5.61 18.39,4 16.4,4H7.6M17.25,5.5A1.25,1.25 0 0,1 18.5,6.75A1.25,1.25 0 0,1 17.25,8A1.25,1.25 0 0,1 16,6.75A1.25,1.25 0 0,1 17.25,5.5M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9Z" />
    </svg>
);

const TikTokIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-black" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
);

const FacebookIcon = () => (
    <svg viewBox="0 0 24 24" className="w-10 h-10 fill-[#1877F2]" xmlns="http://www.w3.org/2000/svg">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
);

export default function Contact() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-50">
            <div className="w-full max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center mb-8"
                >
                    <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-christmas-red">
                        Contáctanos
                    </h1>
                    <p className="text-slate-600 text-base max-w-md mx-auto">
                        Elige tu plataforma favorita para conectar.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <SocialCard
                        href="https://wa.me/573108216274"
                        icon={<WhatsAppIcon />}
                        label="WhatsApp"
                        description="Atención y citas"
                        color="bg-green-50"
                        delay={0.1}
                    />
                    <SocialCard
                        href="https://www.facebook.com/marketplace/profile/100084833282957/"
                        icon={<FacebookIcon />}
                        label="Marketplace"
                        description="Perfil y calificaciones"
                        color="bg-blue-50"
                        delay={0.2}
                    />
                    <SocialCard
                        href="https://www.instagram.com/techventuresco/"
                        icon={<InstagramIcon />}
                        label="Instagram"
                        description="Historias y contenido"
                        color="bg-pink-50"
                        delay={0.3}
                    />
                    <SocialCard
                        href="https://www.tiktok.com/@techventuresco"
                        icon={<TikTokIcon />}
                        label="TikTok"
                        description="Videos virales"
                        color="bg-slate-100"
                        delay={0.4}
                    />
                </div>
            </div>
        </div>
    );
}
