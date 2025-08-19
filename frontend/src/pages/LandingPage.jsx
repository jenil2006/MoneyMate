// import React from 'react';
// import { Clock, TrendingUp, BarChart3, Facebook, Twitter, Instagram } from 'lucide-react';
// import { useNavigate } from "react-router-dom";

// export default function MoneyMateLanding() {
//     const navigate = useNavigate();
//   return (
//     <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden">
//       {/* Header */}
//       <header className="bg-white shadow-sm">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex justify-between items-center py-4">
//             <div className="text-2xl font-bold text-blue-600">MoneyMate</div>
//             <button 
//                 onClick={() => navigate('/login')}
//                 className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors">
//                 Login
//               </button>
//           </div>
//         </div>
//       </header>

//       {/* Hero Section */}
//       <section className="py-20 lg:py-32">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="grid lg:grid-cols-2 gap-12 items-center">
//             <div>
//               <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
//                 Take Control of Your{' '}
//                 <span className="text-blue-600">Money</span>
//               </h1>
//               <p className="text-xl text-gray-600 mt-6 leading-relaxed">
//                 Track expenditures, implement effective savings plans, and achieve your financial 
//                 goals with our comprehensive money management platform.
//               </p>
//               <button 
//                 onClick={() => navigate('/signup')}
//                 className="bg-blue-600 text-white px-8 py-4 rounded-lg text-lg font-medium mt-8 hover:bg-blue-700 transition-colors transform hover:scale-105">
//                 Get Started
//               </button>
//             </div>
//             <div className="flex justify-center lg:justify-end">
//               <div className="relative">
//                 <div className="w-80 h-80 bg-gradient-to-br from-pink-200 to-pink-300 rounded-3xl flex items-center justify-center shadow-2xl transform hover:rotate-3 transition-transform duration-300">
//                   <div className="w-48 h-48 bg-gradient-to-br from-pink-400 to-pink-500 rounded-full flex items-center justify-center shadow-xl">
//                     {/* Piggy Bank SVG */}
//                     <svg viewBox="0 0 200 200" className="w-32 h-32">
//                       {/* Piggy body */}
//                       <ellipse cx="100" cy="120" rx="70" ry="50" fill="#FF69B4" />
//                       {/* Piggy head */}
//                       <circle cx="100" cy="80" r="45" fill="#FF69B4" />
//                       {/* Ears */}
//                       <ellipse cx="85" cy="55" rx="12" ry="20" fill="#FF1493" transform="rotate(-20 85 55)" />
//                       <ellipse cx="115" cy="55" rx="12" ry="20" fill="#FF1493" transform="rotate(20 115 55)" />
//                       {/* Eyes */}
//                       <circle cx="90" cy="75" r="4" fill="#000" />
//                       <circle cx="110" cy="75" r="4" fill="#000" />
//                       {/* Snout */}
//                       <ellipse cx="100" cy="95" rx="15" ry="10" fill="#FF1493" />
//                       {/* Nostrils */}
//                       <circle cx="95" cy="95" r="2" fill="#C71585" />
//                       <circle cx="105" cy="95" r="2" fill="#C71585" />
//                       {/* Legs */}
//                       <rect x="70" y="160" width="12" height="20" fill="#FF1493" rx="6" />
//                       <rect x="90" y="160" width="12" height="20" fill="#FF1493" rx="6" />
//                       <rect x="110" y="160" width="12" height="20" fill="#FF1493" rx="6" />
//                       <rect x="130" y="160" width="12" height="20" fill="#FF1493" rx="6" />
//                       {/* Coin slot */}
//                       <rect x="95" y="45" width="10" height="3" fill="#C71585" rx="1" />
//                     </svg>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* Benefits Section */}
//       <section className="py-20 bg-white">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
//             The Benefits of <span className="text-blue-600">MoneyMate</span>
//           </h2>
          
//           <div className="grid md:grid-cols-3 gap-8">
//             {/* Intelligent Expense Monitoring */}
//             <div className="text-center group">
//               <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
//                 <Clock className="w-8 h-8 text-blue-600" />
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-4">
//                 Intelligent Expense Monitoring
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 Monitor your spending habits with intuitive categorization 
//                 and real-time updates for complete financial visibility.
//               </p>
//             </div>

//             {/* Strategic Savings Recommendations */}
//             <div className="text-center group">
//               <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
//                 <TrendingUp className="w-8 h-8 text-blue-600" />
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-4">
//                 Strategic Savings Recommendations
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 Receive customized financial guidance designed to maximize 
//                 your savings based on detailed expenditure analysis.
//               </p>
//             </div>

//             {/* Personalized Insights */}
//             <div className="text-center group">
//               <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-200 transition-colors">
//                 <BarChart3 className="w-8 h-8 text-blue-600" />
//               </div>
//               <h3 className="text-xl font-bold text-gray-900 mb-4">
//                 Personalized Insights
//               </h3>
//               <p className="text-gray-600 leading-relaxed">
//                 Access detailed assessments through tailored reports and 
//                 visual representations of your complete financial status.
//               </p>
//             </div>
//           </div>
//         </div>
//       </section>

//       {/* CTA Section */}
//       <section className="py-20 bg-gray-50">
//         <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
//           <h2 className="text-4xl font-bold text-gray-900 mb-6">
//             Initiate your financial optimization strategy today
//           </h2>
//           <p className="text-xl text-gray-600 mb-10 leading-relaxed">
//             Connect with a community of professionals who have enhanced their financial management 
//             practices with MoneyMate.
//           </p>
//           <button 
//             onClick={() => navigate('/signup')}
//             className="bg-blue-600 text-white px-12 py-4 rounded-lg text-lg font-medium hover:bg-blue-700 transition-all transform hover:scale-105 shadow-lg">
//             Sign Up
//           </button>
//         </div>
//       </section>

//       {/* Footer */}
//       <footer className="bg-gray-900 text-white py-12">
//         <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
//           <div className="flex flex-col md:flex-row justify-between items-center">
//             <div className="mb-6 md:mb-0">
//               <div className="text-2xl font-bold text-blue-400 mb-2">MoneyMate</div>
//               <p className="text-gray-400">
//                 © 2025 MoneyMate. All rights reserved.
//               </p>
//             </div>
            
//             <div className="flex items-center space-x-8">
//               <div className="flex space-x-6">
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   <Facebook className="w-6 h-6" />
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   <Twitter className="w-6 h-6" />
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   <Instagram className="w-6 h-6" />
//                 </a>
//               </div>
              
//               <div className="flex space-x-6 text-sm">
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   Privacy Policy
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   Terms of Service
//                 </a>
//                 <a href="#" className="text-gray-400 hover:text-white transition-colors">
//                   Contact
//                 </a>
//               </div>
//             </div>
//           </div>
//         </div>
//       </footer>
//     </div>
//   );
// }






import React from 'react';
import { Clock, TrendingUp, BarChart3, Facebook, Twitter, Instagram, Wallet } from 'lucide-react';
import { useNavigate } from "react-router-dom";


import Footer from '../components/Footer'; 




export default function LandingPage() {
    const navigate = useNavigate();

    const FeatureCard = ({ icon, title, children }) => (
        <div className="text-center p-6 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-lg transition-shadow duration-300">
            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                {icon}
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
            <p className="text-gray-600 leading-relaxed">{children}</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 w-full overflow-x-hidden font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-4">
                        <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
                                <Wallet className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-2xl font-bold text-gray-900">MoneyMate</span>
                        </div>
                        <button 
                            onClick={() => navigate('/login')}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors">
                            Login
                        </button>
                    </div>
                </div>
            </header>

            {/* Hero Section */}
            <section className="py-20 lg:py-32">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h1 className="text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                                Master Your Money, <span className="text-indigo-600">Secure Your Future.</span>
                            </h1>
                            <p className="text-xl text-gray-600 mt-6 leading-relaxed">
                                MoneyMate provides the tools to track spending, create smart budgets, and receive personalized investment advice, all in one place.
                            </p>
                            <button 
                                onClick={() => navigate('/signup')}
                                className="bg-indigo-600 text-white px-8 py-4 rounded-lg text-lg font-medium mt-8 hover:bg-indigo-700 transition-colors transform hover:scale-105">
                                Get Started For Free
                            </button>
                        </div>
                        <div className="flex justify-center lg:justify-end">
                            <div className="relative w-80 h-80">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-200 to-blue-200 rounded-3xl transform -rotate-6"></div>
                                <div className="relative bg-white w-full h-full rounded-3xl flex items-center justify-center shadow-2xl border border-gray-100">
                                    <div className="w-48 h-48 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center shadow-xl">
                                        <Wallet className="w-24 h-24 text-white" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            
            {/* How it Works Section */}
            <section className="py-20 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900">How It Works</h2>
                        <p className="mt-4 text-lg text-gray-600">Achieve financial clarity in three simple steps.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="relative">
                            <div className="flex items-center justify-center text-4xl font-bold text-indigo-600 bg-indigo-100 w-20 h-20 rounded-full mx-auto mb-4">1</div>
                            <h3 className="text-xl font-bold mb-2">Track Your Spending</h3>
                            <p className="text-gray-600">Connect your accounts and let MoneyMate automatically categorize your transactions.</p>
                        </div>
                        <div className="relative">
                             <div className="flex items-center justify-center text-4xl font-bold text-indigo-600 bg-indigo-100 w-20 h-20 rounded-full mx-auto mb-4">2</div>
                            <h3 className="text-xl font-bold mb-2">Get Smart Insights</h3>
                            <p className="text-gray-600">Our AI analyzes your habits to provide forecasts and savings predictions.</p>
                        </div>
                        <div className="relative">
                             <div className="flex items-center justify-center text-4xl font-bold text-indigo-600 bg-indigo-100 w-20 h-20 rounded-full mx-auto mb-4">3</div>
                            <h3 className="text-xl font-bold mb-2">Invest for the Future</h3>
                            <p className="text-gray-600">Receive a personalized investment plan based on your unique financial profile.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <h2 className="text-4xl font-bold text-center text-gray-900 mb-16">
                        The Benefits of <span className="text-indigo-600">MoneyMate</span>
                    </h2>
                    <div className="grid md:grid-cols-3 gap-8">
                        <FeatureCard icon={<Clock className="w-8 h-8 text-indigo-600" />} title="Intelligent Expense Monitoring">
                            Monitor your spending habits with intuitive categorization and real-time updates for complete financial visibility.
                        </FeatureCard>
                        <FeatureCard icon={<TrendingUp className="w-8 h-8 text-indigo-600" />} title="Strategic Savings Recommendations">
                            Receive customized financial guidance designed to maximize your savings based on detailed expenditure analysis.
                        </FeatureCard>
                        <FeatureCard icon={<BarChart3 className="w-8 h-8 text-indigo-600" />} title="Personalized Insights">
                            Access detailed assessments through tailored reports and visual representations of your complete financial status.
                        </FeatureCard>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gray-50">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-4xl font-bold text-gray-900 mb-6">
                        Ready to take control of your financial future?
                    </h2>
                    <p className="text-xl text-gray-600 mb-10 leading-relaxed">
                        Join thousands of users who are building wealth and achieving their goals with MoneyMate.
                    </p>
                    <button 
                        onClick={() => navigate('/signup')}
                        className="bg-indigo-600 text-white px-12 py-4 rounded-lg text-lg font-medium hover:bg-indigo-700 transition-all transform hover:scale-105 shadow-lg">
                        Sign Up Now
                    </button>
                </div>
            </section>

            {/* Use the new Footer component */}
            <Footer />
        </div>
    );
}

