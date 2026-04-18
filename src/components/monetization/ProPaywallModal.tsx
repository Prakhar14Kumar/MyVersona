/**
 * Pro Paywall & Conversion Modal
 * Uses Framer Motion for a native-feeling bottom sheet on Mobile.
 * Designed for frictionless UPI / Razorpay conversion.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Trophy, X, Zap } from 'lucide-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInitiatePayment: (plan: 'micro' | 'pro') => void;
}

export const ProPaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, onInitiatePayment }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <React.Fragment>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />

          {/* Bottom Sheet Modal */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-zinc-900 rounded-t-3xl z-[101] overflow-hidden"
          >
            {/* Header / Hero Graphic */}
            <div className="relative pt-10 pb-6 px-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white text-center">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
              >
                <X size={18} />
              </button>
              
              <div className="mx-auto bg-white/20 w-16 h-16 flex items-center justify-center rounded-2xl mb-4 backdrop-blur-md">
                <Trophy size={32} className="text-yellow-300" />
              </div>
              <h2 className="text-2xl font-bold mb-1">Upgrade to Versona Pro</h2>
              <p className="text-indigo-100 text-sm">Supercharge your career trajectory and stand out among your peers.</p>
            </div>

            {/* Feature List */}
            <div className="p-6 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/40 rounded-full text-purple-600"><Sparkles size={20} /></div>
                <div>
                  <h4 className="font-bold dark:text-white">Unlimited Career Mentor</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Get endless AI guidance for interviews, resumes, and upskilling.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/40 rounded-full text-blue-600"><Trophy size={20} /></div>
                <div>
                  <h4 className="font-bold dark:text-white">Priority Feed Visibility</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Your posts rank 20% higher in your college and career feeds.</p>
                </div>
              </div>
            </div>

            {/* Pricing Action Buttons */}
            <div className="p-6 bg-gray-50 dark:bg-zinc-800/50 border-t border-gray-100 dark:border-gray-800 space-y-3">
              {/* Frictionless Microtransaction for Indian Students */}
              <button 
                onClick={() => onInitiatePayment('micro')}
                className="w-full flex items-center justify-between p-4 border-2 border-indigo-200 bg-white dark:bg-zinc-800 rounded-2xl hover:border-indigo-500 transition shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <Zap className="text-indigo-500" />
                  <div className="text-left">
                    <span className="block font-bold dark:text-white">Quick Top-up (50 Sparks)</span>
                    <span className="text-xs text-gray-500">No commitment</span>
                  </div>
                </div>
                <span className="font-bold text-lg dark:text-white">₹19</span>
              </button>

              {/* Recurring Sub */}
              <button 
                onClick={() => onInitiatePayment('pro')}
                className="w-full py-4 text-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-lg transition"
              >
                Get Pro • ₹149 / month
              </button>
            </div>
          </motion.div>
        </React.Fragment>
      )}
    </AnimatePresence>
  );
};
