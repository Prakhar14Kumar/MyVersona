/**
 * Persistent Floating AI Assistant (FAB)
 * Context-aware: Chatty & fun in 'Social', strict & insightful in 'Career'.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, X, Sparkles } from 'lucide-react';
import { usePersonaStore } from '../../store/personaStore';

export const FloatingAiAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { persona } = usePersonaStore();

  const isCareer = persona === 'career';

  return (
    <>
      {/* Floating Action Button */}
      <motion.button 
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-24 right-6 p-4 rounded-full shadow-2xl z-40 text-white
            ${isCareer ? 'bg-gradient-to-tr from-blue-600 to-indigo-500' : 'bg-gradient-to-tr from-[#FFB88C] to-[#FF6F91]'}`}
      >
        <Bot size={28} />
      </motion.button>

      {/* Slap on an AI Sliding Panel */}
      <AnimatePresence>
        {isOpen && (
            <motion.div 
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="fixed inset-y-0 right-0 w-80 md:w-96 bg-white dark:bg-zinc-900 shadow-2xl z-50 flex flex-col border-l border-gray-100 dark:border-gray-800"
            >
                {/* Header Contextualized */}
                <div className={`p-5 flex justify-between items-center text-white
                    ${isCareer ? 'bg-indigo-600' : 'bg-[#FF6F91]'}`}>
                    <div className="flex items-center gap-2">
                        <Sparkles size={20} />
                        <h2 className="font-bold">
                            {isCareer ? "Career Mentor AI" : "Vibe Check AI"}
                        </h2>
                    </div>
                    <button onClick={() => setIsOpen(false)}><X size={24} /></button>
                </div>

                {/* Simulated Chat Interface */}
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
                    <div className="bg-gray-100 dark:bg-zinc-800 p-3 rounded-2xl rounded-tl-sm w-4/5 text-sm">
                        {isCareer 
                            ? "Hello. I've scanned your recent resume upload. Let's practice behavioral interview questions whenever you're ready." 
                            : "Hey there! Need help putting together a fun caption for your latest reel? Or tracking what's trending at your college?"}
                    </div>
                    {/* Input box ... */}
                </div>
            </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
