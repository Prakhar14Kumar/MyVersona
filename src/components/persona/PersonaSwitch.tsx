/**
 * Global Persona Switch Component
 * A visually satisfying toggle acting as the core mechanic of Versona.
 * Built with framer-motion to feel instantly tactile.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { usePersonaStore } from '../../store/personaStore';
import { UserCircle, Briefcase } from 'lucide-react';

export const PersonaSwitch = () => {
  const { persona, togglePersona } = usePersonaStore();
  const isCareer = persona === 'career';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div 
        className="flex items-center p-1 bg-white/80 dark:bg-black/80 backdrop-blur-md rounded-full shadow-2xl border border-gray-200 dark:border-gray-800 cursor-pointer w-64 h-14 relative"
        onClick={togglePersona}
      >
        {/* Animated Sliding Highlight Background */}
        <motion.div
          className="absolute inset-y-1 h-12 rounded-full shadow-md z-0"
          initial={false}
          animate={{
            left: isCareer ? '50%' : '4px',
            width: 'calc(50% - 4px)',
            backgroundColor: isCareer ? '#1a73e8' : '#ff4785', // Career Blue vs Social Pink
          }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />

        {/* Option: Social */}
        <div className="flex flex-1 items-center justify-center gap-2 z-10 transition-colors duration-300">
          <UserCircle className={`w-5 h-5 ${!isCareer ? 'text-white' : 'text-gray-500'}`} />
          <span className={`font-semibold text-sm ${!isCareer ? 'text-white' : 'text-gray-500'}`}>
            Social
          </span>
        </div>

        {/* Option: Career */}
        <div className="flex flex-1 items-center justify-center gap-2 z-10 transition-colors duration-300">
          <Briefcase className={`w-5 h-5 ${isCareer ? 'text-white' : 'text-gray-500'}`} />
          <span className={`font-semibold text-sm ${isCareer ? 'text-white' : 'text-gray-500'}`}>
            Career
          </span>
        </div>
      </div>
    </div>
  );
};
