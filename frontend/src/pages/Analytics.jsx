import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, AlertTriangle, DollarSign, BarChart3, Activity, Loader2, Brain, Zap, Target as TargetIcon } from 'lucide-react';
import { getAnalyticsData } from '../api/analytics';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Analytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        // Get user ID from JWT token (you might need to decode it or store it separately)
        const token = localStorage.getItem('accessToken');
        if (!token) {
          toast.error('Please login to view analytics');
          return;
        }
        
        const data = await getAnalyticsData();
        console.log("Data from backend:", data);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading analytics data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const totalCategoryPrediction = analyticsData?.category_forecast ? Object.values(analyticsData.category_forecast).reduce((sum, val) => sum + val, 0) : 0;


  const monthlyTrendData = analyticsData?.monthly_trends || [];



// First, get a list of categories that have spending this month
const currentSpendingCategories = new Set((analyticsData?.current_spending || []).map(item => item.name));

const categoryForecastData = analyticsData?.category_forecast ?
  Object.entries(analyticsData.category_forecast)
    .map(([category, predicted]) => {
      const currentSpendingItem = analyticsData.current_spending?.find(item => item.name === category);
      return {
        category,
        current: currentSpendingItem ? currentSpendingItem.value : 0, 
        predicted: Math.round(predicted)
      };
    })
    // This new filter only keeps items whose category is in the current spending list
    .filter(item => currentSpendingCategories.has(item.category))
  : [
    // ... fallback data
  ];

  const currentSpendingData = analyticsData?.current_spending || [
    { name: 'Housing', value: 12000, color: '#8B5CF6' },
    { name: 'Food', value: 8500, color: '#10B981' },
    { name: 'Transport', value: 5500, color: '#F59E0B' },
    { name: 'Entertainment', value: 4200, color: '#EF4444' },
    { name: 'Shopping', value: 3800, color: '#06B6D4' },
    { name: 'Others', value: 3000, color: '#84CC16' }
  ];

// Use the backtest data directly from the API
let savingsData = analyticsData?.savings_over_time || [];

// If there's a future prediction, create a NEW array with the prediction added
if (analyticsData?.savings_prediction) {
  savingsData = [
    ...savingsData, // Copy all the old items using the spread syntax
    {               // Add the new 'Next Month' object at the end
      month: 'Next Month',
      actual: null,
      predicted: analyticsData.savings_prediction
    }
  ];
}

  const insights = analyticsData?.insights || [
    {
      type: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Dining Out',
      description: 'Spending is 25% higher than usual – consider reducing by ₹1,500 to save more.',
      model: 'Isolation Forest'
    },
    {
      type: 'info',
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Transport',
      description: 'Your fuel expenses have increased 15% this month. Consider carpooling or public transport alternatives.',
      model: 'Linear Regression'
    },
    {
      type: 'positive',
      icon: <TargetIcon className="h-5 w-5" />,
      title: 'Shopping',
      description: "You've maintained consistent spending on groceries for 3 months – great budget discipline!",
      model: 'K-Means Clustering'
    },
    {
      type: 'warning',
      icon: <AlertTriangle className="h-5 w-5" />,
      title: 'Subscription Alert',
      description: "You're paying for 3 streaming services but usage data shows you mainly use just one. Consider canceling unused subscriptions.",
      model: 'Decision Tree'
    },
    {
      type: 'positive',
      icon: <TrendingUp className="h-5 w-5" />,
      title: 'Savings Opportunity',
      description: 'Increase your monthly savings by ₹3,000 to reach your house down payment goal 2 months earlier.',
      model: 'Linear Regression'
    },
    {
      type: 'positive',
      icon: <Activity className="h-5 w-5" />,
      title: 'Investment Growth',
      description: 'Your investments are showing 8.2% growth this quarter. You\'re on track to meet your annual goals.',
      model: 'Linear Regression'
    }
  ];

  // Calculate total current spending
  const totalCurrentSpending = currentSpendingData.reduce((sum, item) => sum + item.value, 0);

  // Get predictions for metrics
  const nextMonthPrediction = analyticsData?.next_month_prediction || 35450;
  const savingsPrediction = analyticsData?.savings_prediction || 12750;
  const anomalyCount = analyticsData?.anomalies?.length || 0;

  // Model predictions data
  const modelPredictions = [
    {
      model: 'Linear Regression',
      type: 'Next Month Expense',
      prediction: nextMonthPrediction,
      confidence: 87,
      description: 'Based on historical spending patterns and seasonal trends',
      icon: <TrendingUp className="h-6 w-6 text-blue-600" />
    },
    {
      model: 'RandomForestRegressor',
      type: 'Category Forecast',
      prediction: '₹' + Math.round(totalCategoryPrediction).toLocaleString(),
      confidence: 92,
      description: 'Analyzes spending patterns across different categories',
      icon: <BarChart3 className="h-6 w-6 text-green-600" />
    },
    {
      model: 'Linear Regression',
      type: 'Savings Potential',
      prediction: '₹' + Math.round(savingsPrediction).toLocaleString(),
      confidence: 85,
      description: 'Predicts optimal savings based on income and expense patterns',
      icon: <TargetIcon className="h-6 w-6 text-purple-600" />
    },
    {
      model: 'Isolation Forest',
      type: 'Anomaly Detection',
      prediction: anomalyCount + ' alerts',
      confidence: 94,
      description: 'Identifies unusual spending patterns using machine learning',
      icon: <AlertTriangle className="h-6 w-6 text-orange-600" />
    }
  ];

  const MetricCard = ({ title, value, change, icon, trend, model }) => (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-purple-100 rounded-lg">
            {icon}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">{title}</h3>
            <p className="text-xs text-gray-400">{model}</p>
          </div>
        </div>
        <div className={`flex items-center space-x-1 ${trend === 'up' ? 'text-red-500' : trend === 'down' ? 'text-green-500' : 'text-gray-500'}`}>
          {trend === 'up' ? <TrendingUp className="h-4 w-4" /> : trend === 'down' ? <TrendingDown className="h-4 w-4" /> : null}
        </div>
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {change && (
          <p className={`text-sm ${change.startsWith('+') ? 'text-red-500' : change.startsWith('-') ? 'text-green-500' : 'text-gray-500'}`}>
            {change}
          </p>
        )}
      </div>
    </div>
  );

  const InsightCard = ({ insight }) => {
    const getBorderColor = (type) => {
      switch(type) {
        case 'warning': return 'border-l-red-500';
        case 'positive': return 'border-l-green-500';
        default: return 'border-l-blue-500';
      }
    };

    const getIconColor = (type) => {
      switch(type) {
        case 'warning': return 'text-red-500';
        case 'positive': return 'text-green-500';
        default: return 'text-blue-500';
      }
    };

    return (
      <div className={`bg-white rounded-lg p-4 border-l-4 ${getBorderColor(insight.type)} shadow-sm hover:shadow-md transition-shadow`}>
        <div className="flex items-start space-x-3">
          <div className={`${getIconColor(insight.type)} mt-0.5`}>
            {insight.icon}
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <h4 className="font-medium text-gray-900">{insight.title}</h4>

            </div>
            <p className="text-sm text-gray-600">{insight.description}</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center space-x-2 mb-2">
            <h1 className="text-2xl font-bold text-gray-900">Analytics & Insights</h1>
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full">
              ML-Powered
            </span>
          </div>
          <p className="text-gray-600">Your personalized financial analysis and predictions powered by machine learning.</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <MetricCard
            title="Next Month's Predicted Expense"
            value={`₹${nextMonthPrediction.toLocaleString()}`}
            icon={<TrendingUp className="h-5 w-5 text-purple-600" />}
            trend="up"
          />
          <MetricCard
            title="Category-Wise Forecast"
            value={`₹${totalCurrentSpending.toLocaleString()}`}
            icon={<BarChart3 className="h-5 w-5 text-purple-600" />}
          />
          <MetricCard
            title="Savings Potential"
            value={`₹${Math.round(savingsPrediction).toLocaleString()}`}
            icon={<TargetIcon className="h-5 w-5 text-purple-600" />}
            trend="down"
          />
          <MetricCard
            title="Overspending Alerts"
            value={anomalyCount}
            icon={<AlertTriangle className="h-5 w-5 text-purple-600" />}
          />
        </div>


        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends & Prediction */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends & Prediction</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Actual Expense</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                  <span className="text-gray-600">Predicted Expense</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`₹${value?.toLocaleString()}`, '']} />
                <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="predicted" stroke="#8B5CF6" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category-Wise Forecast */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Category-Wise Forecast</h3>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Current Month</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-gray-600">Next Month (Predicted)</span>
                </div>
              </div>
            </div>
            // AFTER
<ResponsiveContainer width="100%" height={300}>
  <BarChart data={categoryForecastData}>
    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
    <XAxis dataKey="category" angle={-45} textAnchor="end" height={80}/>
    <YAxis />
    <Tooltip formatter={(value) => [`₹${value?.toLocaleString()}`, '']} />
    
    
    <Bar dataKey="current" name="Current Month" fill="#3B82F6" radius={[4, 4, 0, 0]} />
    <Bar dataKey="predicted" name="Next Month (Predicted)" fill="#9CA3AF" radius={[4, 4, 0, 0]} />
  </BarChart>
</ResponsiveContainer>
          </div>

          {/* Current Month Spending by Category */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Month Spending by Category</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={currentSpendingData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {currentSpendingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`₹${value?.toLocaleString()}`, 'Amount']} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
            <div className="text-center mt-4">
              <p className="text-2xl font-bold text-gray-900">₹{totalCurrentSpending.toLocaleString()}</p>
              <p className="text-gray-600">Total</p>
            </div>
          </div>

          {/* Savings Over Time */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
  <div className="flex items-center justify-between mb-4">
    <h3 className="text-lg font-semibold text-gray-900">Savings: Actual vs. Predicted</h3>
    <div className="flex items-center space-x-4 text-sm">
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
        <span className="text-gray-600">Actual Savings</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
        <span className="text-gray-600">Predicted Savings</span>
      </div>
    </div>
  </div>
  <ResponsiveContainer width="100%" height={300}>
    {/* Use savingsData which now comes from your backtesting function */}
    <AreaChart data={savingsData}>
      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip formatter={(value) => [`₹${value?.toLocaleString()}`, '']} />
      {/* Area for what the model would have predicted */}
      <Area type="monotone" dataKey="predicted" stroke="#8B5CF6" fill="#8B5CF6" fillOpacity={0.3} />
      {/* Area for what actually happened */}
      <Area type="monotone" dataKey="actual" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
    </AreaChart>
  </ResponsiveContainer>
</div>
        </div>

        {analyticsData?.anomalies && analyticsData.anomalies.length > 0 && (
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Overspending Alert Details</h3>
                <div className="space-y-3">
                    {analyticsData.anomalies.map((anomaly, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-red-50 border-l-4 border-red-500 rounded">
                            <div className="flex items-center">
                                <AlertTriangle className="w-5 h-5 text-red-600 mr-3" />
                                <div>
                                    <p className="font-semibold text-gray-800">{anomaly.category}</p>
                                    <p className="text-sm text-gray-500">On {new Date(anomaly.date).toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-red-600">₹{parseFloat(anomaly.amount).toLocaleString('en-IN')}</p>
                                <p className="text-xs text-red-500 capitalize">{anomaly.severity} severity</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}


        {/* Smart Insights */}
        <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Smart Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </div>
        </div>
      </div>
    <Footer/>
    </div>
  );
};

export default Analytics;