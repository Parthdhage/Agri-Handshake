import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const About = () => {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);

    const steps = [
        { icon: '🌾', title: 'List Your Crops', desc: 'Farmers post what they want to sell with photos, pricing (in ₹), and location details.' },
        { icon: '🛒', title: 'Buyers Browse & Offer', desc: 'Buyers browse the marketplace and submit their best offer on any listing.' },
        { icon: '✅', title: 'Accept the Best Deal', desc: 'Farmer reviews all offers and picks the one they like most.' },
        { icon: '🔒', title: 'Payment Locked Securely', desc: 'Buyer\'s money goes into an automated secure locker — nobody can touch it until delivery is confirmed.' },
        { icon: '📸', title: 'Ship & Upload Proof', desc: 'Farmer ships the crops and uploads photo proof of delivery.' },
        { icon: '✔️', title: 'Buyer Confirms Receipt', desc: 'Buyer checks the quality and approves the delivery.' },
        { icon: '💰', title: 'Farmer Gets Paid', desc: 'Payment releases automatically to the farmer. If buyer doesn\'t respond in 24hrs, farmer can claim payment.' },
    ];

    const fadeUp = { initial: { opacity: 0, y: 30 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true } };

    return (
        <div className="min-h-screen bg-brand-bg pt-20">
            {/* Hero */}
            <section className="py-16 text-center">
                <div className="max-w-4xl mx-auto px-4">
                    <motion.h1 {...fadeUp} className="text-4xl sm:text-5xl font-bold text-brand-green font-display mb-4">
                        How AgriHandshake Works
                    </motion.h1>
                    <motion.p {...fadeUp} transition={{ delay: 0.1 }} className="text-lg text-brand-muted max-w-2xl mx-auto">
                        A step-by-step guide to understand how our blockchain-powered marketplace protects both farmers and buyers.
                    </motion.p>
                </div>
            </section>

            {/* Interactive Steps */}
            <section className="py-12 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="space-y-4">
                        {steps.map((step, i) => (
                            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.05 }}
                                onClick={() => setActiveStep(i)}
                                className={`cursor-pointer bg-brand-bg rounded-2xl p-6 border-l-4 transition-all duration-300 hover:shadow-md ${
                                    i === activeStep ? 'border-brand-green shadow-md' : i < activeStep ? 'border-brand-green-light' : 'border-gray-200'
                                }`}>
                                <div className="flex items-start gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 transition-colors ${
                                        i <= activeStep ? 'bg-brand-green text-white' : 'bg-gray-100 text-brand-muted'
                                    }`}>{i < activeStep ? '✓' : step.icon}</div>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs font-bold text-brand-green">Step {i + 1}</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-brand-text">{step.title}</h3>
                                        {i === activeStep && (
                                            <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                                className="text-brand-muted mt-2 leading-relaxed">{step.desc}</motion.p>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why AgriHandshake */}
            <section className="py-16">
                <div className="max-w-6xl mx-auto px-4">
                    <motion.h2 {...fadeUp} className="text-3xl font-bold text-brand-text font-display text-center mb-12">
                        Why Choose AgriHandshake?
                    </motion.h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[
                            { icon: '🔒', title: 'Secure Payment Locker', desc: 'Money is locked in an automated smart contract — neither party can cheat.' },
                            { icon: '📸', title: 'Tamper-Proof Delivery Photos', desc: 'Delivery photos stored on decentralized storage (IPFS) — can\'t be edited or deleted.' },
                            { icon: '📦', title: 'Shipment Tracking', desc: 'Track orders with courier name and tracking number, visible to both parties.' },
                            { icon: '⏰', title: '24-Hour Auto-Protection', desc: 'If buyer doesn\'t respond in 24hrs, farmer automatically gets paid.' },
                            { icon: '⚖️', title: 'Fair Dispute Resolution', desc: 'Neutral arbitrator reviews evidence and splits payment fairly.' },
                            { icon: '💸', title: 'Zero Commission', desc: 'No middlemen. Every rupee goes directly from buyer to farmer.' },
                        ].map((item, i) => (
                            <motion.div key={i} {...fadeUp} transition={{ delay: i * 0.08 }}
                                className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-brand-green-light hover:shadow-lg transition-all group">
                                <span className="text-3xl mb-3 block group-hover:scale-110 transition-transform">{item.icon}</span>
                                <h3 className="text-lg font-bold text-brand-text mb-2">{item.title}</h3>
                                <p className="text-brand-muted text-sm leading-relaxed">{item.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* For Farmers / For Buyers */}
            <section className="py-16 bg-white">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <motion.div {...fadeUp} className="bg-brand-green rounded-3xl p-8 text-white">
                            <div className="text-4xl mb-4">🚜</div>
                            <h3 className="text-2xl font-bold mb-5 font-display">For Farmers</h3>
                            <ul className="space-y-3">
                                {['List crops in minutes with photos & INR pricing', 'Guaranteed payment — no more chasing buyers',
                                  'Upload delivery proof to protect yourself', 'Auto-receive payment even if buyer goes silent'].map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-brand-green-light font-bold mt-0.5">✓</span>
                                        <span className="text-green-100 text-sm">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                        <motion.div {...fadeUp} transition={{ delay: 0.1 }} className="bg-brand-gold rounded-3xl p-8 text-white">
                            <div className="text-4xl mb-4">🛒</div>
                            <h3 className="text-2xl font-bold mb-5 font-display">For Buyers</h3>
                            <ul className="space-y-3">
                                {['Browse verified crop listings with real photos', 'Your money stays safe until you confirm quality',
                                  'Track shipments with courier tracking numbers', 'Fair dispute resolution if something goes wrong'].map((b, i) => (
                                    <li key={i} className="flex items-start gap-3">
                                        <span className="text-amber-200 font-bold mt-0.5">✓</span>
                                        <span className="text-amber-100 text-sm">{b}</span>
                                    </li>
                                ))}
                            </ul>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-16 text-center">
                <div className="max-w-2xl mx-auto px-4">
                    <motion.div {...fadeUp}>
                        <h2 className="text-3xl font-bold text-brand-text font-display mb-4">Ready to Start?</h2>
                        <p className="text-brand-muted mb-8">Join the marketplace that puts farmers and buyers first.</p>
                        <motion.button whileHover={{ scale: 1.05, y: -3 }} whileTap={{ scale: 0.97 }}
                            onClick={() => navigate('/login')}
                            className="px-10 py-4 bg-brand-green text-white text-lg font-bold rounded-2xl shadow-xl transition-all">
                            Get Started — It's Free →
                        </motion.button>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};

export default About;
