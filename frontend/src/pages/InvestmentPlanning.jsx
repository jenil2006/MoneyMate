
import React, { useEffect, useState, useMemo } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Rocket, Scale, DollarSign, Info, Wallet, Menu, ChevronDown, AlertTriangle, CheckCircle, TrendingUp, Calendar } from "lucide-react";
import { toast } from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
// --- Axios Instance Setup (from your axios.js) ---
const baseURL = 'http://localhost:8000/';
const axiosInstance = axios.create({
  baseURL,
  timeout: 30000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});
axiosInstance.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);


// --- Main Investment Planning Component ---
const InvestmentPlanning = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [investmentPercentage, setInvestmentPercentage] = useState(50);
    const [selectedOptions, setSelectedOptions] = useState({});
    const [projectionYears, setProjectionYears] = useState(5); // NEW state for time projection

    useEffect(() => {
        const fetchPlan = async () => {
            setLoading(true);
            try {
                const response = await axiosInstance.get('/api/analytics/investment-plan/');
                setData(response.data);
                const initialSelections = {};
                for (const riskLevel in response.data.investment_options) {
                    if (response.data.investment_options[riskLevel].length > 0) {
                        initialSelections[riskLevel] = response.data.investment_options[riskLevel][0];
                    }
                }
                setSelectedOptions(initialSelections);
            } catch (err) {
                const errorMessage = err.response?.data?.error || "Failed to generate a plan.";
                setError(errorMessage);
                toast.error(errorMessage);
            } finally {
                setLoading(false);
            }
        };
        fetchPlan();
    }, []);

    const handleOptionSelect = (riskLevel, option) => {
        setSelectedOptions(prev => ({ ...prev, [riskLevel]: option }));
    };

    const monthlyInvestment = data ? data.predicted_surplus * (investmentPercentage / 100) : 0;

    // --- UPDATED: Calculation for Projected Future Value ---
    const portfolioSummary = useMemo(() => {
        if (!data || Object.keys(selectedOptions).length === 0 || monthlyInvestment === 0) {
            return { projectedMin: "0", projectedMax: "0", totalInvested: "0" };
        }

        let weightedMinAnnualRate = 0;
        let weightedMaxAnnualRate = 0;

        for (const riskLevel in selectedOptions) {
            const option = selectedOptions[riskLevel];
            const allocation = data.allocation_percentages[riskLevel];
            if (option && allocation) {
                weightedMinAnnualRate += allocation * option.return_pa[0];
                weightedMaxAnnualRate += allocation * option.return_pa[1];
            }
        }

        const monthlyMinRate = weightedMinAnnualRate / 100 / 12;
        const monthlyMaxRate = weightedMaxAnnualRate / 100 / 12;
        const numberOfMonths = projectionYears * 12;

        // Future Value of an Annuity Formula: FV = P * [(((1 + r)^n - 1) / r)]
        const calculateFutureValue = (monthlyRate) => {
            if (monthlyRate === 0) return monthlyInvestment * numberOfMonths;
            return monthlyInvestment * (Math.pow(1 + monthlyRate, numberOfMonths) - 1) / monthlyRate;
        };
        
        const projectedMinValue = calculateFutureValue(monthlyMinRate);
        const projectedMaxValue = calculateFutureValue(monthlyMaxRate);
        const totalInvestedValue = monthlyInvestment * numberOfMonths;

        return {
            projectedMin: projectedMinValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            projectedMax: projectedMaxValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
            totalInvested: totalInvestedValue.toLocaleString('en-IN', { maximumFractionDigits: 0 }),
        };
    }, [selectedOptions, data, monthlyInvestment, projectionYears]);


    if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="text-center py-20"><p>Generating your plan...</p></div></div>;
    if (error) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="max-w-5xl mx-auto px-4"><p className="text-center text-red-500 p-4">{error}</p></div></div>;

    const riskInfo = { Conservative: { icon: <Shield />, color: "blue" }, Moderate: { icon: <Scale />, color: "yellow" }, Aggressive: { icon: <Rocket />, color: "red" } };
    const currentRisk = riskInfo[data.risk_profile];

    return (
        <div className="min-h-screen bg-gray-50 font-sans">
            <Navbar />
            <div className="max-w-5xl mx-auto px-4 pb-12">
                <div className="text-center mb-10">
                    <h1 className="text-4xl font-bold text-gray-800">Build Your Investment Plan</h1>
                    <p className="mt-2 text-lg text-gray-500">Explore options and create a portfolio that works for you.</p>
                </div>

                <div className="bg-white p-8 rounded-2xl shadow-lg border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b pb-8 mb-8">
                        <div className="text-center">
                            <DollarSign className="w-12 h-12 mx-auto text-green-500 bg-green-100 p-3 rounded-full mb-3" />
                            <h2 className="text-lg font-semibold text-gray-700">Predicted Monthly Surplus</h2>
                            <p className="text-4xl font-bold text-gray-900">₹{data.predicted_surplus.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p>
                        </div>
                        <div className="text-center">
                            <div className={`w-12 h-12 mx-auto bg-${currentRisk.color}-100 p-3 rounded-full flex items-center justify-center`}>{React.cloneElement(currentRisk.icon, { className: `w-8 h-8 text-${currentRisk.color}-500` })}</div>
                            <h2 className="text-lg font-semibold text-gray-700">Your Inferred Investor Profile</h2>
                            <p className="text-4xl font-bold text-gray-900">{data.risk_profile}</p>
                        </div>
                    </div>
                     <div className="mb-8">
                        <div className="text-center mb-4"><h2 className="text-xl font-semibold">Set Your Monthly Investment</h2></div>
                        <input type="range" min="0" max="100" value={investmentPercentage} onChange={(e) => setInvestmentPercentage(Number(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                        <div className="flex justify-between text-sm mt-2"><span>0%</span><span className="font-bold text-indigo-600 text-2xl">{investmentPercentage}%</span><span>100%</span></div>
                        <div className="bg-indigo-50 p-4 rounded-lg text-center mt-4"><p className="text-gray-600">Amount to Invest per Month:</p><p className="text-3xl font-bold text-indigo-800">₹{monthlyInvestment.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</p></div>
                    </div>

                    <div className="space-y-8 mb-8">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center">1. Choose Your Investments</h2>
                        {Object.entries(data.investment_options).map(([riskLevel, options]) => (
                            data.allocation_percentages[riskLevel] > 0 && (
                                <div key={riskLevel}>
                                    <h3 className="text-lg font-bold mb-2">{riskLevel} <span className="text-indigo-600 font-semibold">({data.allocation_percentages[riskLevel] * 100}%)</span></h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {options.map(option => (
                                            <div key={option.name} onClick={() => handleOptionSelect(riskLevel, option)} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedOptions[riskLevel]?.name === option.name ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400'}`}>
                                                <div className="flex justify-between items-start">
                                                    <h4 className="font-bold text-gray-900">{option.name}</h4>
                                                    {selectedOptions[riskLevel]?.name === option.name && <CheckCircle className="w-6 h-6 text-indigo-600" />}
                                                </div>
                                                <p className="text-xs text-gray-500">Annual Return: {option.return_pa[0]}% - {option.return_pa[1]}%</p>
                                                <p className="text-sm text-gray-600 mt-2">{option.description}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )
                        ))}
                    </div>

                    <div className="border-t pt-8">
                        <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">2. See Your Potential Growth</h2>
                        
                        {/* --- NEW: Time Projection Selector --- */}
                        <div className="flex justify-center items-center gap-4 mb-6">
                            <Calendar className="w-6 h-6 text-gray-500" />
                            <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
                                {[1, 5, 10, 15].map(year => (
                                    <button key={year} onClick={() => setProjectionYears(year)} className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${projectionYears === year ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-white'}`}>
                                        {year} Year{year > 1 && 's'}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* --- UPDATED: Portfolio Summary Card --- */}
                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 mb-6">
                            <h3 className="text-lg font-bold text-center text-gray-800 mb-4">Projected Value after {projectionYears} Year{projectionYears > 1 && 's'}</h3>
                            <div className="flex flex-col md:flex-row justify-around items-center text-center gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">You Invest</p>
                                    <p className="text-2xl font-bold text-gray-800">₹{portfolioSummary.totalInvested}</p>
                                </div>
                                <div className="border-l h-12 mx-4 hidden md:block"></div>
                                <div>
                                    <p className="text-sm text-gray-500">Potential Value Range</p>
                                    <p className="text-2xl font-bold text-green-600">₹{portfolioSummary.projectedMin} - ₹{portfolioSummary.projectedMax}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 bg-yellow-50 border-l-4 border-yellow-400 text-yellow-800 p-4 rounded-r-lg flex items-start gap-3">
                        <AlertTriangle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
                        <div>
                            <h4 className="font-bold">Disclaimer</h4>
                            <p className="text-sm">These projections are illustrative estimates based on the selected options and do not guarantee future results. All investments are subject to market risks. Please consult a certified financial advisor.</p>
                        </div>
                    </div>
                </div>
            </div>
            <Footer/>
        </div>
    );
};

export default InvestmentPlanning;
