import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

function DatabaseView() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('listings');
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginData, setLoginData] = useState({ username: '', password: '' });

    const handleLogin = (e) => {
        e.preventDefault();
        // Simple admin check - in a real app this would be a backend call
        if (loginData.username === 'admin' && loginData.password === 'admin123') {
            setIsAuthenticated(true);
        } else {
            alert("Invalid credentials. Try admin / admin123");
        }
    };

    const fetchData = useCallback(async (endpoint) => {
        if (!isAuthenticated) return;
        setLoading(true);
        try {
            const res = await fetch(`http://localhost:5000/api/db/${endpoint}`);
            const json = await res.json();
            setData(json);
        } catch (e) {
            console.error(e);
            alert("Failed to fetch data. Is the backend running on port 5000?");
        } finally {
            setLoading(false);
        }
    }, [isAuthenticated]);

    useEffect(() => {
        if (isAuthenticated) {
            fetchData(activeTab);
        }
    }, [activeTab, isAuthenticated, fetchData]);

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 p-4">
                <div className="bg-white rounded-3xl shadow-2xl p-10 w-full max-w-md">
                    <div className="text-center mb-8">
                        <span className="text-5xl mb-4 block">🔐</span>
                        <h1 className="text-3xl font-bold text-gray-900">Admin Login</h1>
                        <p className="text-gray-500 mt-2">Enter credentials to view database</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Username</label>
                            <input
                                type="text"
                                value={loginData.username}
                                onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-xl shadow-lg transition-all"
                        >
                            Login to Database
                        </button>
                    </form>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm font-semibold"
                    >
                        ← Back to Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-8 font-inter text-gray-800">
            <nav className="mb-8 flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <span>💾</span> Database View
                </h1>
                <div className="flex gap-4">
                    <button onClick={() => setIsAuthenticated(false)} className="text-red-600 hover:text-red-800 font-semibold">
                        Logout
                    </button>
                    <button onClick={() => navigate('/')} className="text-emerald-600 hover:text-emerald-800 font-semibold">
                        Back to App
                    </button>
                </div>
            </nav>

            <div className="mb-6 flex space-x-4 border-b border-gray-200">
                <button
                    onClick={() => setActiveTab('listings')}
                    className={`pb-2 px-4 font-semibold transition-all ${activeTab === 'listings'
                        ? 'border-b-2 border-emerald-500 text-emerald-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Listings Table
                </button>
                <button
                    onClick={() => setActiveTab('escrows')}
                    className={`pb-2 px-4 font-semibold transition-all ${activeTab === 'escrows'
                        ? 'border-b-2 border-blue-500 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700'
                        }`}
                >
                    Escrows Table
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-500">Loading data...</div>
                ) : data.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No records found locally.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 uppercase font-semibold border-b border-gray-200">
                                <tr>
                                    {Object.keys(data[0]).map((key) => (
                                        key !== 'createdAt' && key !== 'updatedAt' && (
                                            <th key={key} className="px-6 py-3">{key}</th>
                                        )
                                    ))}
                                    <th className="px-6 py-3">Timestamp</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {data.map((row) => (
                                    <tr key={row.id} className="hover:bg-gray-50 transition-all">
                                        {Object.entries(row).map(([key, value]) => (
                                            key !== 'createdAt' && key !== 'updatedAt' && (
                                                <td key={key} className="px-6 py-4 font-mono text-gray-600 truncate max-w-xs" title={String(value)}>
                                                    {String(value)}
                                                </td>
                                            )
                                        ))}
                                        <td className="px-6 py-4 text-gray-400">
                                            {new Date(row.createdAt).toLocaleString()}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DatabaseView;
