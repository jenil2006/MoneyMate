import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Link } from 'react-router-dom';

// These imports will now correctly connect to your project files
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Dashboard = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userName, setUserName] = useState("User");
  const [dashboardData, setDashboardData] = useState({
    stats: {
      totalIncome: 0,
      totalExpenses: 0,
      savings: 0
    },
    expensesTrend: [],
    recentTransactions: []
  });

  const formatCurrency = (amount) => `₹${Math.abs(amount).toLocaleString('en-IN')}`;
  const currentDate = new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  useEffect(() => {
    // Get username from token
    try {
      const accessToken = localStorage.getItem('accessToken');
      if (accessToken) {
        const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
        if (tokenPayload.username) {
          setUserName(tokenPayload.username);
        }
      }
    } catch (e) {
      console.log('Could not decode token for username');
    }

    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);
    
        const summaryResponse = await axiosInstance.get('/api/transactions/summary/');
        const summaryData = summaryResponse.data;
    
        const transactionsResponse = await axiosInstance.get('/api/transactions/');
        const transactionsData = transactionsResponse.data;
    
        const dailyTrendResponse = await axiosInstance.get('/api/transactions/daily-trend/');
        const dailyTrendData = dailyTrendResponse.data;
    
        const savings = summaryData.total_income - summaryData.total_expense;
    
// Replace your recentTransactions logic with this
const recentTransactions = [...transactionsData]
  .sort((a, b) => new Date(b.date) - new Date(a.date)) // ✅ ensure latest first
  .slice(0, 5)
  .map(transaction => ({
    id: transaction.id,
    date: new Date(transaction.date).toLocaleDateString('en-GB', { 
      day: '2-digit', month: 'short', year: 'numeric' 
    }),
    description: 
      transaction.description && transaction.description.trim() !== "" 
        ? transaction.description 
        : (transaction.category && transaction.category !== "Sample Expense" 
            ? transaction.category 
            : "Transaction"),
    category: transaction.category,
    amount: transaction.amount,
    type: transaction.type
  }));


    
        setDashboardData({
          stats: {
            totalIncome: summaryData.total_income,
            totalExpenses: summaryData.total_expense,
            savings: savings
          },
          expensesTrend: dailyTrendData,   // ✅ real income vs expense trend
          recentTransactions
        });
    
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
        toast.error('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);
 

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center text-center">
        <div>
          <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Dashboard</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-50">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-lg">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Welcome, {userName}!</h1>
                    <p className="text-indigo-100">{currentDate}</p>
                </div>
                <div className="mt-4 md:mt-0">
                  <p className="text-indigo-100 italic text-sm md:text-right">
                    "Small savings today lead to big wins tomorrow!"
                  </p>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard icon={<TrendingUp className="w-6 h-6 text-green-600" />} title="Total Income" value={formatCurrency(dashboardData.stats.totalIncome)} />
            <StatCard icon={<TrendingDown className="w-6 h-6 text-red-600" />} title="Total Expenses" value={formatCurrency(dashboardData.stats.totalExpenses)} />
            <StatCard 
              icon={dashboardData.stats.savings >= 0 ? <TrendingUp className="w-6 h-6 text-blue-600" /> : <TrendingDown className="w-6 h-6 text-orange-600" />} 
              title="Net Savings" 
              value={`${dashboardData.stats.savings >= 0 ? '+' : '-'}${formatCurrency(dashboardData.stats.savings)}`}
              valueColor={dashboardData.stats.savings >= 0 ? 'text-blue-600' : 'text-orange-600'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Expenses and Income</h2>
              <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
  <LineChart data={dashboardData.expensesTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
    <XAxis dataKey="day" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false}/>
    <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`}/>
    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1, strokeDasharray: '3 3' }} />
    <Line type="monotone" dataKey="income" stroke="#16a34a" strokeWidth={3} dot={{ r: 4, fill: '#16a34a' }} name="Income" />
    <Line type="monotone" dataKey="expense" stroke="#dc2626" strokeWidth={3} dot={{ r: 4, fill: '#dc2626' }} name="Expenses" />
  </LineChart>
</ResponsiveContainer>

              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
              <div className="space-y-4">
  {dashboardData.recentTransactions.map((tx) => (
    <div key={tx.id} className="flex items-center justify-between border-b pb-2">
      <div>
        <p className="text-sm text-gray-900">{tx.category}</p>
        <p className="text-sm text-gray-700">{tx.date}</p>
      </div>
      <p className={`font-semibold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
        {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
      </p>
    </div>
  ))}
</div>

               <div className="mt-6 text-center">
                <Link to="/transactions" className="text-indigo-600 hover:underline font-medium text-sm">
                    View All Transactions
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};


// Helper components
const StatCard = ({ icon, title, value, valueColor = 'text-gray-900' }) => (
  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-medium text-gray-500">{title}</h3>
      {icon}
    </div>
    <p className={`text-3xl font-bold ${valueColor}`}>{value}</p>
    <p className="text-xs text-gray-500 mt-1">This month</p>
  </div>
);

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className={p.dataKey === "income" ? "text-green-600" : "text-red-600"}>
            {p.name}: ₹{p.value.toLocaleString('en-IN')}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default Dashboard;