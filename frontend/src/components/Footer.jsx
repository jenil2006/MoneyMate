import React from 'react';
import { Facebook, Twitter, Instagram, Wallet } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="bg-gray-900 text-white py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-center">
                    <div className="mb-6 md:mb-0 text-center md:text-left">
                        <div className="flex items-center justify-center md:justify-start space-x-2 mb-2">
                            <div className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-indigo-400" />
                            </div>
                            <span className="text-2xl font-bold text-white">MoneyMate</span>
                        </div>
                        <p className="text-gray-400">© 2025 MoneyMate. All rights reserved.</p>
                    </div>
                    <div className="flex items-center space-x-6">
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Facebook className="w-6 h-6" /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Twitter className="w-6 h-6" /></a>
                        <a href="#" className="text-gray-400 hover:text-white transition-colors"><Instagram className="w-6 h-6" /></a>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
