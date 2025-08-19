import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit, Trash2, X, ChevronLeft, ChevronRight, RefreshCcw } from 'lucide-react';
import axiosInstance from '../api/axios';
import toast from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
};

const Transactions = () => {

  const [transactions, setTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().slice(0, 10),
    category: '',
    type: '',
    amount: '',
    description: ''
  });

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;
  
  const categories = ["Bills & Utilities", "Entertainment", "Food", "Health", "Shopping", "Transportation","Salary", "Other"];

  
  const fetchTransactions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await axiosInstance.get('/api/transactions/');
      const data = response.data.map(tx => ({
        ...tx,
        rawDate: new Date(tx.date) 
      }));
      setTransactions(data);
    } catch (err) {
      setError('Failed to load transactions');
      toast.error('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = (tx.category?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                          (tx.description?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesMonth = selectedMonth ? tx.rawDate.getMonth() + 1 === parseInt(selectedMonth) : true;
    const matchesYear = selectedYear ? tx.rawDate.getFullYear() === parseInt(selectedYear) : true;
    return matchesSearch && matchesMonth && matchesYear;
  });

  
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedMonth, selectedYear]);

  
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedMonth('');
    setSelectedYear('');
    setCurrentPage(1);
  };

  const indexOfLastTransaction = currentPage * transactionsPerPage;
  const indexOfFirstTransaction = indexOfLastTransaction - transactionsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstTransaction, indexOfLastTransaction);
  const totalPages = Math.ceil(filteredTransactions.length / transactionsPerPage);

  const nextPage = () => { if (currentPage < totalPages) setCurrentPage(currentPage + 1); };
  const prevPage = () => { if (currentPage > 1) setCurrentPage(currentPage - 1); };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      category: '',
      type: '',
      amount: '',
      description: ''
    });
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.category || !formData.type || !formData.amount) {
      toast.error('Please fill in all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = { ...formData, amount: parseFloat(formData.amount) };
      if (showEditModal) {
        await axiosInstance.put(`/api/transactions/${selectedTransaction.id}/`, payload);
        toast.success('Transaction updated successfully!');
        setShowEditModal(false);
      } else {
        await axiosInstance.post('/api/transactions/', payload);
        toast.success('Transaction added successfully!');
        setShowAddModal(false);
      }
      resetForm();
      fetchTransactions();
    } catch (err) {
      toast.error(`Failed to ${showEditModal ? 'update' : 'add'} transaction`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async () => {
    setIsSubmitting(true);
    try {
      await axiosInstance.delete(`/api/transactions/${selectedTransaction.id}/`);
      toast.success('Transaction deleted successfully!');
      setShowDeleteConfirm(false);
      fetchTransactions();
    } catch (err) {
      toast.error('Failed to delete transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (transaction) => {
    setSelectedTransaction(transaction);
    setFormData({
      date: transaction.date,
      category: transaction.category,
      type: transaction.type,
      amount: Math.abs(parseFloat(transaction.amount)).toString(),
      description: transaction.description || ''
    });
    setShowEditModal(true);
  };

  const openDeleteConfirm = (transaction) => {
    setSelectedTransaction(transaction);
    setShowDeleteConfirm(true);
  };
  
  const today = new Date().toISOString().slice(0, 10);



  if (isLoading) return <div className="flex items-center justify-center h-screen bg-gray-50">Loading...</div>;
  if (error) return <div className="flex items-center justify-center h-screen text-red-600 bg-gray-50">{error}</div>;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-8 w-full">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Transactions</h1>

        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 mb-8 items-center">
            <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by category or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500"
                />
            </div>
            <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900">
                <option value="">All Months</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('en-US', { month: 'long' })}</option>
                ))}
            </select>
            <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-indigo-500 text-gray-900">
                <option value="">All Years</option>
                {Array.from(new Set(transactions.map(t => t.rawDate.getFullYear()))).sort((a, b) => b - a).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
            </select>
            <div className='flex gap-2'>
              <button onClick={resetFilters} className="w-full bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-300 flex items-center justify-center gap-2">
                  <RefreshCcw className="w-4 h-4" /> Reset
              </button>
            </div>
        </div>
        
        <div className="flex justify-end mb-4">
            <button onClick={() => setShowAddModal(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-indigo-700 flex items-center justify-center gap-2">
                <Plus className="w-5 h-5" /> Add New Transaction
            </button>
        </div>


        <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {currentTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tx.description}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-indigo-100 text-indigo-800">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold text-right ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {tx.type === 'income' ? '+' : '-'}₹{parseFloat(tx.amount).toLocaleString('en-IN')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEditModal(tx)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-full"><Edit className="w-4 h-4" /></button>
                        <button onClick={() => openDeleteConfirm(tx)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded-full"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {currentTransactions.length === 0 && (
            <div className="text-center py-12 text-gray-500">No transactions found for the selected filters.</div>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6">
            <button onClick={prevPage} disabled={currentPage === 1} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <span className="text-sm text-gray-700">Page {currentPage} of {totalPages}</span>
            <button onClick={nextPage} disabled={currentPage === totalPages} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 flex items-center gap-2">
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </main>
      <Footer />

      <Modal isOpen={showAddModal || showEditModal} onClose={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} title={showEditModal ? "Edit Transaction" : "Add New Transaction"}>
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input type="date" value={formData.date} max={today} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
            <select name="category" value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required>
              <option value="" disabled>Select Category</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" required>
              <option value="" disabled>Select Type</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
            <input type="number" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" placeholder="0.00" step="0.01" min="0" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
            <textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full border border-gray-300 p-2 rounded-lg" rows="3" />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => { setShowAddModal(false); setShowEditModal(false); resetForm(); }} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save Transaction'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)} title="Delete Transaction">
        <p className="text-gray-600">Are you sure you want to delete this transaction? This action cannot be undone.</p>
        <div className="flex justify-end gap-3 pt-4 mt-4">
          <button onClick={() => setShowDeleteConfirm(false)} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Cancel</button>
          <button onClick={handleDeleteTransaction} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50">
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Transactions;