"use client";

import React, { useState, useEffect } from "react";
import { Shield, ArrowRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AgeModal() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const isConfirmed = localStorage.getItem("age-confirmed");
    if (!isConfirmed) {
      setShow(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem("age-confirmed", "true");
    setShow(false);
  };

  const handleExit = () => {
    window.location.href = "https://www.google.com";
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-xl p-6"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="w-full max-w-lg bg-secondary border border-muted rounded-[32px] p-10 text-center relative overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
            
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                <Shield size={40} className="text-primary" />
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4">Adults Only</h2>
            <p className="text-muted-foreground mb-10 leading-relaxed text-sm">
              This app contains content intended for adults aged 18 and over. 
              By continuing you confirm that you are at least 18 years old 
              and consent to viewing mature content.
            </p>

            <div className="space-y-4">
              <button
                onClick={handleConfirm}
                className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 group shadow-xl shadow-primary/20"
              >
                I am 18 or older — Continue
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>
              
              <button
                onClick={handleExit}
                className="w-full bg-transparent hover:bg-muted border border-muted text-muted-foreground font-medium py-4 rounded-2xl transition-all"
              >
                I am under 18 — Exit
              </button>
            </div>

            <p className="mt-8 text-[10px] text-muted-foreground">
              By continuing, you agree to the <span className="underline cursor-pointer">Terms of Service</span> and <span className="underline cursor-pointer">Privacy Policy</span>.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
