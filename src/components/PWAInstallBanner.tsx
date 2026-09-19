import { motion, AnimatePresence } from 'framer-motion';
import { MdClose } from 'react-icons/md';

interface Props {
  show: boolean;
  onInstall: () => void;
  onDismiss: () => void;
}

export default function PWAInstallBanner({ show, onInstall, onDismiss }: Props) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: '-100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '-100%', opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 150,
            paddingTop: 'env(safe-area-inset-top, 0px)',
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 14px',
            background: 'rgba(255, 255, 255, 0.96)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            boxShadow: 'inset 0 -1px 0 var(--border)',
          }}>
            <img
              src="/icons/icon-96x96.png"
              alt=""
              style={{ width: 32, height: 32, borderRadius: '8px', flexShrink: 0 }}
            />
            <span style={{
              flex: 1,
              fontSize: '13px',
              fontWeight: 600,
              color: 'var(--card-text)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              Install Panchang
            </span>
            <button
              onClick={onInstall}
              style={{
                background: 'var(--olive)',
                color: '#ffffff',
                padding: '6px 16px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              Install
            </button>
            <button
              onClick={onDismiss}
              style={{
                width: 28,
                height: 28,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <MdClose size={18} color="var(--text-muted)" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
