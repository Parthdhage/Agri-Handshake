import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useWallet } from '../context/WalletContext';
import Logo from './Logo';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { account, loading, role, disconnectWallet } = useWallet();

  // Role-aware primary links
  const allLinks = [
    { path: '/listings', label: 'Marketplace', icon: '🛒', roles: ['farmer', 'buyer', null] },
    { path: '/create', label: 'Sell Crops', icon: '🌾', roles: ['farmer', null] },  // hidden for buyers
    { path: '/history', label: 'My Trades', icon: '📜', roles: ['farmer', 'buyer', null] },
  ];
  const primaryLinks = allLinks.filter(l => l.roles.includes(role));

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center cursor-pointer group" onClick={() => navigate('/')}>
            <Logo size={36} className="mr-2 group-hover:scale-110 transition-transform" />
            <span className="text-lg font-bold text-brand-green font-display">AgriHandshake</span>
          </div>

          {/* Primary Nav — Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {primaryLinks.map((link) => (
              <button key={link.path} onClick={() => navigate(link.path)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  location.pathname === link.path
                    ? 'bg-brand-green text-white shadow-sm'
                    : 'text-brand-muted hover:bg-gray-50 hover:text-brand-text'
                }`}>
                <span className="mr-1.5">{link.icon}</span>{link.label}
              </button>
            ))}
            {/* Learn More dropdown */}
            <LearnMoreDropdown navigate={navigate} currentPath={location.pathname} />
          </div>

          {/* Wallet + Mobile Menu */}
          <div className="flex items-center space-x-3">
            {account ? (
              <div className="flex items-center space-x-2">
                {role && (
                  <span className="hidden lg:inline text-xs font-bold px-3 py-1 rounded-full bg-brand-gold-pale text-brand-gold border border-amber-200 capitalize">
                    {role === 'farmer' ? '🌾 Farmer' : '🛒 Buyer'}
                  </span>
                )}
                <div className="hidden sm:flex items-center gap-2 bg-brand-green-pale text-brand-green px-3 py-1.5 rounded-full font-mono text-xs border border-green-200">
                  <span className="w-2 h-2 rounded-full bg-brand-green-light animate-pulse" />
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <button onClick={disconnectWallet}
                  className="p-2 text-brand-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Disconnect">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                  </svg>
                </button>
              </div>
            ) : (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/login')} disabled={loading}
                className="px-5 py-2 bg-brand-green text-white rounded-xl font-semibold shadow-md transition-all text-sm disabled:opacity-50">
                Connect Wallet
              </motion.button>
            )}
            <MobileMenu links={primaryLinks} navigate={navigate} currentPath={location.pathname} />
          </div>
        </div>
      </div>
    </nav>
  );
};

// Learn More dropdown — informational links
const LearnMoreDropdown = ({ navigate, currentPath }) => {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);

  React.useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)}
        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center gap-1 ${
          currentPath === '/about' ? 'bg-brand-green text-white' : 'text-brand-muted hover:bg-gray-50 hover:text-brand-text'
        }`}>
        ℹ️ Learn More
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor"
          className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          <button onClick={() => { navigate('/about'); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-gray-50 transition-colors">
            📖 How It Works
          </button>
          <button onClick={() => { navigate('/about'); setOpen(false); }}
            className="w-full text-left px-4 py-3 text-sm font-semibold text-brand-muted hover:bg-gray-50 transition-colors">
            🛡️ About AgriHandshake
          </button>
        </motion.div>
      )}
    </div>
  );
};

const MobileMenu = ({ links, navigate, currentPath }) => {
  const [open, setOpen] = React.useState(false);
  return (
    <div className="relative md:hidden">
      <button onClick={() => setOpen(!open)} className="p-2 text-brand-muted hover:bg-gray-100 rounded-lg">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          {open ? <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />}
        </svg>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-200 py-2 z-50">
          {links.map((link) => (
            <button key={link.path} onClick={() => { navigate(link.path); setOpen(false); }}
              className={`w-full text-left px-4 py-3 text-sm font-semibold transition-all ${
                currentPath === link.path ? 'bg-brand-green-pale text-brand-green' : 'text-brand-muted hover:bg-gray-50'
              }`}>
              <span className="mr-2">{link.icon}</span>{link.label}
            </button>
          ))}
          <div className="border-t border-gray-100 mt-1 pt-1">
            <button onClick={() => { navigate('/about'); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-brand-muted hover:bg-gray-50">ℹ️ Learn More</button>
            <button onClick={() => { navigate('/'); setOpen(false); }}
              className="w-full text-left px-4 py-3 text-sm text-brand-muted hover:bg-gray-50">🏠 Home</button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Navbar;
