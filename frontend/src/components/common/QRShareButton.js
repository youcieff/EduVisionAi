"use client";
import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiShare2, FiX, FiCopy, FiCheck } from 'react-icons/fi';
import toast from 'react-hot-toast';

export default function QRShareButton({ videoId, title }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== 'undefined'
    ? `${window.location.origin}/video/${videoId}`
    : `/video/${videoId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success('Link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--input-bg)] border border-[var(--glass-border)] hover:border-[#14B8A6]/40 text-[var(--text-muted)] hover:text-[#14B8A6] transition-all text-sm font-semibold"
        title="Share via QR"
      >
        <FiShare2 size={16} />
        QR
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="glass p-8 rounded-2xl border border-[#14B8A6]/30 shadow-2xl max-w-sm w-full text-center relative"
            >
              <button onClick={() => setOpen(false)} className="absolute top-4 right-4 text-[var(--text-muted)] hover:text-white transition-colors">
                <FiX size={20} />
              </button>

              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Share This Content</h3>
              <p className="text-sm text-[var(--text-muted)] mb-6 truncate">{title}</p>

              <div className="bg-white p-4 rounded-xl inline-block mb-6 shadow-lg">
                <QRCodeSVG
                  value={url}
                  size={200}
                  bgColor="#ffffff"
                  fgColor="#0a0a1a"
                  level="H"
                  includeMargin={false}
                />
              </div>

              <p className="text-xs text-[var(--text-muted)] mb-4 font-mono bg-[var(--input-bg)] p-2 rounded-lg truncate">{url}</p>

              <button
                onClick={handleCopy}
                className="btn-gold w-full py-3 rounded-xl flex items-center justify-center gap-2 font-bold"
              >
                {copied ? <><FiCheck /> Copied!</> : <><FiCopy /> Copy Link</>}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
