import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Plus } from 'lucide-react';
import { getUserInfo, updateUserInfo } from '../lib/api/user';
import { User } from '../lib/api/types';
import { useAuth } from '../contexts/AuthContext';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [fullName, setFullName] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [country, setCountry] = useState('');
  const [language, setLanguage] = useState('');
  const [userCurrencies, setUserCurrencies] = useState<string[]>([]);

  // For password change (mockup as no API provided)
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);

  // Currency management states
  const [newCurrency, setNewCurrency] = useState('');

  const availableCurrencies = [
    { code: 'USD', name: 'US Dollar' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'EUR', name: 'Euro' },
    { code: 'GBP', name: 'British Pound' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'CHF', name: 'Swiss Franc' },
  ];

  useEffect(() => {
    fetchUserInfo();
  }, []);

  const fetchUserInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedUser = await getUserInfo();
      setUser(fetchedUser);
      setFullName(fetchedUser.full_name || '');
      setProfilePicture(fetchedUser.profile_picture || '');
      setCountry(fetchedUser.country || '');
      setLanguage(fetchedUser.language || '');
      setUserCurrencies(fetchedUser.currencies || ['USD']); // Default to USD if none provided
    } catch (err: any) {
      setError(err.message || 'Failed to fetch user information.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!user) return;

    try {
      const updatedUser = await updateUserInfo({
        full_name: fullName,
        profile_picture: profilePicture,
        country: country,
        language: language,
      });
      setUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    }
  };

  const handleUpdateCurrencies = async () => {
    setError(null);
    if (!user) return;

    try {
      const updatedUser = await updateUserInfo({
        currencies: userCurrencies,
      });
      setUser(updatedUser);
      alert('Currency settings updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Failed to update currency settings.');
    }
  };

  const handleAddCurrency = () => {
    if (newCurrency && !userCurrencies.includes(newCurrency)) {
      setUserCurrencies([...userCurrencies, newCurrency]);
      setNewCurrency('');
    }
  };

  const handleRemoveCurrency = (currencyToRemove: string) => {
    setUserCurrencies(userCurrencies.filter(currency => currency !== currencyToRemove));
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordChangeError('New password and confirmation do not match.');
      return;
    }
    // In a real application, you would send currentPassword and newPassword to a backend API
    // For now, this is a mockup.
    console.log('Attempting to change password...', { currentPassword, newPassword });
    setPasswordChangeSuccess('Password change simulated successfully!');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  if (loading) return <div className="text-center mt-8">Loading profile...</div>;
  if (error) return <div className="text-center mt-8 text-red-500">Error: {error}</div>;
  if (!user) return <div className="text-center mt-8">User not found.</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Profile Settings</h1>
      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Profile Information</h2>
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Username
            </label>
            <input type="text" value={user.username} readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-70 cursor-not-allowed" />
            <p className="text-xs text-zinc-400 mt-1">Username cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Email
            </label>
            <input type="email" value={user.email} readOnly className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 opacity-70 cursor-not-allowed" />
            <p className="text-xs text-zinc-400 mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Full Name
            </label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Profile Picture URL
            </label>
            <input type="text" value={profilePicture} onChange={e => setProfilePicture(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Country
            </label>
            <input type="text" value={country} onChange={e => setCountry(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Language
            </label>
            <input type="text" value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#ff9416] text-white rounded-md hover:bg-[#e08414]">
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Change Password</h2>
        {passwordChangeError && <p className="text-red-500 mb-4">Error: {passwordChangeError}</p>}
        {passwordChangeSuccess && <p className="text-green-500 mb-4">{passwordChangeSuccess}</p>}
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Current Password
            </label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              New Password
            </label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Confirm New Password
            </label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <button type="submit" className="px-4 py-2 bg-[#ff9416] text-white rounded-md hover:bg-[#e08414]">
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Currency Settings</h2>
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateCurrencies(); }} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-3">
              My Currencies
            </label>
            <div className="space-y-2">
              {userCurrencies.length === 0 && <p className="text-zinc-400">No currencies added. Add one below.</p>}
              {userCurrencies.map(currency => (
                <div key={currency} className={`flex items-center justify-between px-3 py-2 rounded-md bg-zinc-800`}>
                  <div className="flex items-center">
                    <span className="font-medium">{currency}</span>
                    <span className="text-zinc-400 text-sm ml-2">
                      ({availableCurrencies.find(c => c.code === currency)?.name || currency})
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button onClick={() => handleRemoveCurrency(currency)} className="p-1 hover:bg-zinc-700 rounded-full text-red-400">
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Add Currency
            </label>
            <div className="flex space-x-2">
              <select value={newCurrency} onChange={e => setNewCurrency(e.target.value)} className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500">
                <option value="">Select currency</option>
                {availableCurrencies.filter(c => !userCurrencies.includes(c.code)).map(currency => (
                  <option key={currency.code} value={currency.code}>
                    {currency.code} ({currency.name})
                  </option>
                ))}
              </select>
              <button type="button" onClick={handleAddCurrency} disabled={!newCurrency || userCurrencies.includes(newCurrency)} className={`px-3 py-2 bg-[#ff9416] text-white rounded-md hover:bg-[#e08414] flex items-center ${!newCurrency || userCurrencies.includes(newCurrency) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                <Plus size={16} className="mr-1" /> Add
              </button>
            </div>
          </div>
          <button type="submit" className="px-4 py-2 bg-[#ff9416] text-white rounded-md hover:bg-[#e08414]">
            Save Currency Settings
          </button>
        </form>
      </div>

      <div className="bg-zinc-900 rounded-lg p-6">
        <h2 className="text-xl font-bold mb-4">Account Actions</h2>
        <button onClick={handleLogout} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
