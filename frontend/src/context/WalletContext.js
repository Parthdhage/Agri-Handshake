import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

const WalletContext = createContext();

const HARDHAT_CHAIN_ID = '0x7A69'; // 31337 in hex (Hardhat default)
const HARDHAT_CHAIN_ID_DECIMAL = 31337;
const HARDHAT_RPC = 'http://127.0.0.1:8545';

// Retry helper — MetaMask can inject late
const getEthereumProvider = async (retries = 3) => {
    for (let i = 0; i < retries; i++) {
        if (window.ethereum) {
            if (window.ethereum.providers?.length) {
                return window.ethereum.providers.find(p => p.isMetaMask) || window.ethereum.providers[0];
            }
            return window.ethereum;
        }
        await new Promise(r => setTimeout(r, 1000));
    }
    return null;
};

// Auto-switch to Hardhat network if needed
const ensureCorrectNetwork = async (eth) => {
    try {
        const chainId = await eth.request({ method: 'eth_chainId' });
        console.log('[AgriHandshake] MetaMask chain:', chainId, 'Expected:', HARDHAT_CHAIN_ID);
        if (chainId !== HARDHAT_CHAIN_ID) {
            try {
                await eth.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: HARDHAT_CHAIN_ID }],
                });
            } catch (switchError) {
                if (switchError.code === 4902) {
                    await eth.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: HARDHAT_CHAIN_ID,
                            chainName: 'Hardhat Local',
                            nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                            rpcUrls: [HARDHAT_RPC],
                        }],
                    });
                }
            }
        }
    } catch (e) {
        console.warn("Network switch skipped:", e.message);
    }
};

export const WalletProvider = ({ children }) => {
    const [account, setAccount] = useState(null);
    const [signer, setSigner] = useState(null);
    const [provider, setProvider] = useState(null);
    const [loading, setLoading] = useState(false);
    const [walletReady, setWalletReady] = useState(false);
    const [role, setRoleState] = useState(() => localStorage.getItem('agri_role') || null);

    const setRole = (r) => {
        setRoleState(r);
        if (r) localStorage.setItem('agri_role', r);
        else localStorage.removeItem('agri_role');
    };

    // Create a properly configured BrowserProvider
    const createProvider = (eth) => {
        // Pass explicit network to prevent ethers from caching a wrong one
        const network = new ethers.Network('hardhat', HARDHAT_CHAIN_ID_DECIMAL);
        return new ethers.BrowserProvider(eth, network);
    };

    const checkConnection = useCallback(async () => {
        const eth = await getEthereumProvider(2);
        if (!eth) { setWalletReady(true); return; }
        setWalletReady(true);
        try {
            const accounts = await eth.request({ method: 'eth_accounts' });
            if (accounts && accounts.length > 0) {
                await ensureCorrectNetwork(eth);
                const browserProvider = createProvider(eth);
                const s = await browserProvider.getSigner();
                const addr = await s.getAddress();
                console.log('[AgriHandshake] Auto-connected:', addr);
                setAccount(addr);
                setSigner(s);
                setProvider(browserProvider);
            }
        } catch (e) { console.warn("Auto-connect skipped:", e.message); }
    }, []);

    const connectWallet = async (forceSelect = false) => {
        const eth = await getEthereumProvider(3);
        if (!eth) {
            toast.error(
                <div>
                    <strong>MetaMask not found</strong>
                    <p style={{fontSize:'13px',marginTop:'4px'}}>Install the MetaMask browser extension to continue.</p>
                    <a href="https://metamask.io/download/" target="_blank" rel="noreferrer"
                       style={{color:'#fff',textDecoration:'underline',fontSize:'13px'}}>Download MetaMask →</a>
                </div>, { autoClose: 8000 }
            );
            return;
        }
        try {
            setLoading(true);
            await ensureCorrectNetwork(eth);
            if (forceSelect) {
                await eth.request({ method: 'wallet_requestPermissions', params: [{ eth_accounts: {} }] });
            }
            const accounts = await eth.request({ method: "eth_requestAccounts" });
            if (!accounts || accounts.length === 0) throw new Error("No accounts returned.");

            const browserProvider = createProvider(eth);
            const s = await browserProvider.getSigner();
            const addr = await s.getAddress();
            console.log('[AgriHandshake] Connected:', addr);
            setAccount(addr); setSigner(s); setProvider(browserProvider);
        } catch (e) {
            console.error("MetaMask Error:", e);
            if (e.code === 4001) toast.warning("Connection rejected. Approve the request in MetaMask.");
            else if (e.code === -32002) toast.info("Request pending. Open your MetaMask extension.");
            else toast.error(e.message || "Failed to connect.");
        } finally { setLoading(false); }
    };

    const disconnectWallet = () => {
        setAccount(null); setSigner(null); setProvider(null);
        setRole(null);
    };

    useEffect(() => {
        const handleAccountsChanged = (accounts) => {
            if (accounts.length > 0) checkConnection();
            else disconnectWallet();
        };
        const handleChainChanged = () => window.location.reload();

        checkConnection();
        const setupListeners = async () => {
            const eth = await getEthereumProvider(2);
            if (eth) {
                eth.on('accountsChanged', handleAccountsChanged);
                eth.on('chainChanged', handleChainChanged);
            }
        };
        setupListeners();
        return () => {
            if (window.ethereum) {
                window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                window.ethereum.removeListener('chainChanged', handleChainChanged);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [checkConnection]);

    return (
        <WalletContext.Provider value={{ account, signer, provider, loading, walletReady, role, setRole, connectWallet, disconnectWallet }}>
            {children}
        </WalletContext.Provider>
    );
};

export const useWallet = () => {
    const context = useContext(WalletContext);
    if (!context) throw new Error('useWallet must be used within a WalletProvider');
    return context;
};
