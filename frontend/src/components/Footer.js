import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from './Logo';

const Footer = () => {
    const navigate = useNavigate();

    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                    <div>
                        <div className="flex items-center space-x-3 mb-4">
                            <Logo size={32} />
                            <h3 className="text-xl font-bold font-playfair">AgriHandshake</h3>
                        </div>
                        <p className="text-gray-400 text-sm leading-relaxed">
                            Secure farm-to-table trading powered by blockchain.
                            Your crops, your terms, your payment — guaranteed.
                        </p>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-gray-400">Quick Links</h4>
                        <ul className="space-y-2">
                            <li><button onClick={() => navigate('/')} className="text-gray-300 hover:text-white transition-colors text-sm">Home</button></li>
                            <li><button onClick={() => navigate('/listings')} className="text-gray-300 hover:text-white transition-colors text-sm">Marketplace</button></li>
                            <li><button onClick={() => navigate('/history')} className="text-gray-300 hover:text-white transition-colors text-sm">My Trades</button></li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-bold mb-4 uppercase tracking-wider text-gray-400">Connect</h4>
                        <ul className="space-y-2">
                            <li><a href="https://github.com/agrihandshake" className="text-gray-300 hover:text-white transition-colors text-sm">GitHub</a></li>
                            <li><a href="https://twitter.com/agrihandshake" className="text-gray-300 hover:text-white transition-colors text-sm">Twitter</a></li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <p className="text-gray-500 text-xs">© 2026 Team AgriHandshake. All rights reserved.</p>
                    <p className="text-gray-600 text-xs font-mono">Powered by Ethereum + IPFS</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
