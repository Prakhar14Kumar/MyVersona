/**
 * Credit Display Component
 * Clean, visual indicator showing the user how many AI "Sparks" they have globally.
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Plus } from 'lucide-react';
// import { useAuth } from '../../hooks/useAuth'; 

interface CreditDisplayProps {
  balance: number;
  onTopUpClick: () => void;
}

export const CreditDisplay: React.FC<CreditDisplayProps> = ({ balance, onTopUpClick }) => {
  const isLow = balance <= 3;

  return (
    <div className="flex items-center gap-2">
      <motion.div 
        animate={isLow ? { scale: [1, 1.05, 1], opacity: [0.8, 1, 0.8] } : {}}
        transition={isLow ? { repeat: Infinity, duration: 2 } : {}}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm shadow-sm border
          ${isLow 
            ? 'bg-red-50 text-red-600 border-red-200 dark:bg-red-900/30' 
            : 'bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'}`}
      >
        <Zap size={16} className={isLow ? 'text-red-500' : 'text-indigo-500'} fill="currentColor" />
        {balance} Sparks
      </motion.div>

      {/* Frictionless Micro-transaction Hook */}
      <button 
        onClick={onTopUpClick}
        className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition flex items-center justify-center text-gray-700 dark:text-gray-300 shadow-sm"
      >
        <Plus size={16} />
      </button>
    </div>
  );
};
