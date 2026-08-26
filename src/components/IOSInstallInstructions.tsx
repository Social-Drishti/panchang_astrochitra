import { motion, AnimatePresence } from 'framer-motion';
import { MdClose, MdShare, MdAddToHomeScreen } from 'react-icons/md';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function IOSInstallInstructions({ open, onClose }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="drawer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ zIndex: 200 }}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              position: 'fixed',
              bottom: 0,
              left: 0,
              right: 0,
              background: 'var(--bg-card)',
              borderRadius: '20px 20px 0 0',
              padding: '16px 20px 32px',
              paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))',
              zIndex: 201,
              boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--olive)' }}>
                Install Panchang
              </h3>
              <button onClick={onClose} style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MdClose size={22} color="var(--text-muted)" />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'var(--gold-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MdShare size={20} color="var(--olive)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                    1. Tap the Share button
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Tap the share icon at the bottom of Safari
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '10px',
                  background: 'var(--gold-light)', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <MdAddToHomeScreen size={20} color="var(--olive)" />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--text)' }}>
                    2. Select Add to Home Screen
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Scroll down and tap Add to Home Screen
                  </div>
                </div>
              </div>

              <div style={{
                background: 'var(--bg)', borderRadius: '10px', padding: '12px 16px',
                fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5',
              }}>
                The Panchang app will now appear on your home screen like a native app.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
