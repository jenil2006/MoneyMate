import axiosInstance from './axios';

export const getAnalyticsData = async () => {
  try {
    const response = await axiosInstance.get('/api/analytics/');
    return response.data;
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    throw error;
  }
};
