import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Logo from '../components/Logo';

const LandingPage = () => {
    const navigate = useNavigate();

    const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

    return (
        <div className="min-h-screen bg-brand-bg">
            <Navbar />

            {/* ===== HERO ===== */}
            <section className="relative min-h-screen flex items-center justify-center pt-20 pb-16 overflow-hidden">
                <div className="absolute inset-0 opacity-[0.03]"
                    style={{ backgroundImage: 'radial-gradient(circle, #166534 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6 }}>
                        <Logo size={80} className="mx-auto mb-6" />
                    </motion.div>

                    <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
                        className="text-5xl sm:text-6xl lg:text-7xl font-bold text-brand-green font-display mb-4 leading-tight">
                        AgriHandshake
                    </motion.h1>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
                        className="text-xl sm:text-2xl text-brand-text font-semibold mb-3">
                        Sell Crops. Buy Directly. No Middlemen.
                    </motion.p>

                    <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
                        className="text-base sm:text-lg text-brand-muted mb-10 max-w-2xl mx-auto leading-relaxed">
                        A blockchain-powered marketplace where farmers and buyers trade
                        directly with secure automated payments, delivery proof, and shipment tracking.
                    </motion.p>

                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center">
                        <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 bg-brand-green text-white text-lg font-bold rounded-2xl shadow-xl transition-all">
                            Get Started →
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/about')}
                            className="px-10 py-4 bg-white text-brand-green text-lg font-bold rounded-2xl shadow-lg border-2 border-brand-green transition-all">
                            Learn How It Works
                        </motion.button>
                    </motion.div>

                    {/* Feature pills */}
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
                        className="flex flex-wrap justify-center gap-3 mt-10">
                        {['Zero Commission', '24hr Auto-Release', 'Photo Verified Proof', 'Shipment Tracking'].map((tag, i) => (
                            <span key={i} className="bg-white px-4 py-2 rounded-full text-sm font-semibold text-brand-green border border-green-200 shadow-sm">
                                ✓ {tag}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ===== QUICK OVERVIEW — Bento Grid ===== */}
            <section className="py-20 bg-white">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <motion.div {...fadeUp} className="text-center mb-14">
                        <h2 className="text-3xl sm:text-4xl font-bold text-brand-text font-display mb-3">What Makes Us Different</h2>
                        <p className="text-brand-muted text-lg">No middlemen, no commission, no trust issues</p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { icon: '🔒', title: 'Secure Payment', desc: 'Money is locked until delivery is confirmed. Neither party can cheat.', color: 'bg-brand-green' },
                            { icon: '📸', title: 'Photo Proof', desc: 'Delivery photos stored permanently — tamper-proof evidence.', color: 'bg-brand-gold' },
                            { icon: '📦', title: 'Live Tracking', desc: 'Track shipments with courier name and tracking number.', color: 'bg-blue-600' },
                        ].map((item, i) => (
                            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.1 }}
                                className="bg-brand-bg rounded-2xl p-8 border border-gray-100 hover:border-brand-green-light hover:shadow-lg transition-all group cursor-default">
                                <div className={`w-14 h-14 ${item.color} rounded-2xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform text-white shadow-md`}>
                                    {item.icon}
                                </div>
                                <h3 className="text-xl font-bold text-brand-text mb-2">{item.title}</h3>
                                <p className="text-brand-muted leading-relaxed text-sm">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== CTA ===== */}
            <section className="py-20 bg-brand-green">
                <div className="max-w-3xl mx-auto px-4 text-center">
                    <motion.div {...fadeUp}>
                        <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4 font-display">Ready to Trade Smarter?</h2>
                        <p className="text-green-200 mb-8 text-lg">Join the marketplace that puts farmers and buyers first.</p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/login')}
                                className="px-12 py-5 bg-white text-brand-green text-xl font-bold rounded-2xl shadow-2xl transition-all">
                                Get Started — It's Free →
                            </motion.button>
                            <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                                onClick={() => navigate('/about')}
                                className="px-12 py-5 border-2 border-white text-white text-xl font-bold rounded-2xl transition-all hover:bg-white/10">
                                Learn More
                            </motion.button>
                        </div>
                    </motion.div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default LandingPage;
