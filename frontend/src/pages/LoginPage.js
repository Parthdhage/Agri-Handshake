import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '../context/WalletContext';
import Logo from '../components/Logo';

const LoginPage = () => {
  const navigate = useNavigate();
  const { account, loading, connectWallet, setRole } = useWallet();
  const [showRoleSelect, setShowRoleSelect] = useState(false);

  useEffect(() => {
    if (account) setShowRoleSelect(true);
  }, [account]);

  const handleRoleSelect = (selectedRole, path) => {
    setRole(selectedRole);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-brand-bg flex items-center justify-center p-4">
      <div className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle, #166534 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      <AnimatePresence mode="wait">
        {!showRoleSelect ? (
          <motion.div key="connect" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.4 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">

            <div className="bg-brand-green p-8 text-center">
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}>
                <Logo size={64} className="mx-auto mb-4" />
              </motion.div>
              <h1 className="text-2xl font-bold text-white font-display">AgriHandshake</h1>
              <p className="text-green-200 mt-1 text-sm">Secure Farm-to-Table Trading</p>
            </div>

            <div className="p-8 text-center">
              <h2 className="text-2xl font-bold text-brand-text mb-2">Welcome!</h2>
              <p className="text-brand-muted mb-8 leading-relaxed text-sm">
                Connect your MetaMask wallet to start buying or selling crops securely.
              </p>

              <motion.button whileHover={{ scale: 1.02, boxShadow: '0 12px 24px rgba(22,101,52,0.2)' }}
                whileTap={{ scale: 0.98 }} onClick={() => connectWallet()} disabled={loading}
                className="w-full py-4 bg-brand-green text-white font-bold rounded-2xl shadow-lg transition-all text-lg disabled:opacity-50 flex items-center justify-center gap-3">
                {loading ? (
                  <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Connecting...</>
                ) : (
                  <><span className="text-2xl">🦊</span> Connect with MetaMask</>
                )}
              </motion.button>

              {/* Setup helper */}
              <div className="mt-8 bg-gray-50 rounded-xl p-4 text-left">
                <h4 className="text-xs font-bold text-brand-muted uppercase tracking-wider mb-3">Setting up MetaMask?</h4>
                <ol className="space-y-2 text-xs text-brand-muted">
                  <li className="flex gap-2"><span className="bg-brand-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>Install MetaMask from <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="text-brand-green font-semibold hover:underline">metamask.io</a></li>
                  <li className="flex gap-2"><span className="bg-brand-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>Create a wallet and save your seed phrase</li>
                  <li className="flex gap-2"><span className="bg-brand-green text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>Click "Connect with MetaMask" above — we'll set up the network for you</li>
                </ol>
              </div>

              <button onClick={() => navigate('/')} className="mt-4 text-sm text-brand-muted hover:text-brand-text font-medium">
                ← Back to Home
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="role" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.5 }}
            className="relative z-10 bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md overflow-hidden">

            <div className="bg-brand-green p-6 text-center">
              <motion.div initial={{ scale: 0 }} animate={{ scale: [0, 1.2, 1] }} transition={{ duration: 0.5 }}
                className="text-5xl mb-2">✅</motion.div>
              <h1 className="text-xl font-bold text-white">Connected Successfully!</h1>
              <p className="text-green-200 text-xs font-mono mt-2 break-all px-4">{account}</p>
            </div>

            <div className="p-8">
              <p className="text-center text-brand-muted mb-6 text-sm font-semibold">I am a...</p>
              <div className="space-y-3">
                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('farmer', '/create')}
                  className="w-full py-5 bg-brand-green text-white font-bold rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-3">
                  🌾 Farmer — I Want to Sell
                </motion.button>
                <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect('buyer', '/listings')}
                  className="w-full py-5 bg-brand-gold text-white font-bold rounded-2xl shadow-lg transition-all text-lg flex items-center justify-center gap-3">
                  🛒 Buyer — I Want to Purchase
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LoginPage;
