import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletContext";
import { API_BASE, IPFS_GATEWAY, CATEGORY_COLORS, getContract } from "../constants/contract";

function ListingsPage() {
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [offers, setOffers] = useState({});
  const [offerPriceINR, setOfferPriceINR] = useState("");
  const [offerQuantity, setOfferQuantity] = useState("");
  const [loading, setLoading] = useState(false);
  const [escrows, setEscrows] = useState({});
  const [activeOfferId, setActiveOfferId] = useState(null);
  const { account, signer, role } = useWallet();
  const [contract, setContract] = useState(null);

  // ETH price for INR conversion
  const [ethPriceINR, setEthPriceINR] = useState(null);
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr");
        const data = await res.json();
        setEthPriceINR(data.ethereum.inr);
      } catch (e) { setEthPriceINR(200000); }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (signer) setContract(getContract(signer));
  }, [signer]);

  const loadOffers = async (id) => {
    if (!contract) return;
    try {
      const result = await contract.getOffers(id);
      const list = [];
      for (let i = 0; i < result[0].length; i++) {
        list.push({
          index: i,
          vendor: result[0][i],
          price: Number(ethers.formatEther(result[1][i])),
          formattedQuantity: Number(ethers.formatEther(result[2][i])),
          accepted: result[3][i]
        });
      }
      setOffers((prev) => ({ ...prev, [id]: list.filter((o) => !o.accepted) }));
    } catch (e) { console.error("loadOffers", e); }
  };

  const loadEscrow = async (listingId) => {
    try {
      const escrowId = await contract.listingToEscrow(listingId);
      if (Number(escrowId) > 0) {
        const e = await contract.getEscrow(escrowId);
        setEscrows(prev => ({
          ...prev,
          [listingId]: {
            id: Number(e.details.id),
            buyer: e.details.buyer,
            farmer: e.details.farmer,
            amount: ethers.formatEther(e.details.amount),
            deposited: e.details.deposited,
            released: e.state.released,
          }
        }));
      }
    } catch (e) { console.error("loadEscrow", e); }
  };

  const loadListings = async () => {
    if (!contract) return;
    try {
      const count = Number(await contract.listingCount());
      const all = [];
      for (let i = 1; i <= count; i++) {
        try {
          const l = await contract.getListing(i);
          await loadOffers(i);
          await loadEscrow(i);
          all.push({
            id: i,
            farmer: l.farmer,
            crop: l.crop,
            category: l.category || "Other",
            quantity: Number(ethers.formatEther(l.quantity)),
            price: Number(ethers.formatEther(l.pricePerKg)),
            location: l.location,
            description: l.description || "",
            imageHash: l.imageHash || "",
            harvestDate: Number(l.harvestDate),
            minOrderQty: Number(ethers.formatEther(l.minOrderQty)),
            active: l.active
          });
        } catch (e) { console.error("listing", i, e); }
      }
      setListings(all);
    } catch (e) { console.error("loadListings", e); }
  };

  const sendContractTx = async (functionName, args, options = {}) => {
    const iface = contract.interface;
    const calldata = iface.encodeFunctionData(functionName, args);
    // Get the correct nonce from the node — bypasses MetaMask's stale cache
    const address = await signer.getAddress();
    const provider = signer.provider;
    const nonce = await provider.getTransactionCount(address, "latest");
    console.log(`[AgriHandshake] ${functionName} using nonce:`, nonce);
    const tx = await signer.sendTransaction({
      to: await contract.getAddress(),
      data: calldata,
      gasLimit: options.gasLimit || 500000,
      nonce: nonce,
      ...(options.value ? { value: options.value } : {}),
    });
    console.log(`[AgriHandshake] ${functionName} TX sent:`, tx.hash);
    const receipt = await tx.wait();
    console.log(`[AgriHandshake] ${functionName} confirmed, block:`, receipt.blockNumber);
    return receipt;
  };

  const handleTxError = (e, action) => {
    console.error(`${action} error:`, e);
    let msg = `${action} failed`;
    if (e.code === 4001 || e.code === 'ACTION_REJECTED') msg = 'Transaction rejected in MetaMask.';
    else if (e.message && e.message.includes('nonce')) msg = 'Nonce error — clear MetaMask activity data and retry.';
    else if (e.reason) msg = e.reason;
    else if (e.shortMessage) msg = e.shortMessage;
    else if (e.message && e.message.length < 200) msg = e.message;
    toast.error(msg);
  };

  const makeOffer = async (id) => {
    if (!contract) return toast.error("Connect wallet");
    if (!offerPriceINR || !offerQuantity) return toast.warning("Enter price and quantity");
    const listing = listings.find(l => l.id === id);
    if (!listing) return;
    if (Number(offerQuantity) > listing.quantity) return toast.warning("Quantity exceeds available stock");
    if (listing.minOrderQty > 0 && Number(offerQuantity) < listing.minOrderQty) {
      return toast.warning(`Minimum order is ${listing.minOrderQty} KG`);
    }
    if (!ethPriceINR) return toast.warning("ETH price not loaded yet");
    const offerPriceETH = (Number(offerPriceINR) / ethPriceINR).toFixed(8);
    try {
      setLoading(true);
      await sendContractTx('makeOffer', [id, ethers.parseEther(offerQuantity), ethers.parseEther(offerPriceETH)], { gasLimit: 300000 });
      setOfferPriceINR(""); setOfferQuantity(""); setActiveOfferId(null);
      await loadListings();
      toast.success("✅ Offer submitted!");
    } catch (e) {
      handleTxError(e, 'Offer');
    } finally { setLoading(false); }
  };

  const acceptOffer = async (listingId, offerIndex) => {
    if (!contract) return toast.error("Connect wallet");
    try {
      setLoading(true);
      await sendContractTx('acceptOffer', [listingId, offerIndex]);

      // Sync to DB
      try {
        const escrowId = await contract.listingToEscrow(listingId);
        if (Number(escrowId) > 0) {
          const e = await contract.getEscrow(escrowId);
          const offersRes = await contract.getOffers(listingId);
          const qty = ethers.formatEther(offersRes[2][Number(e.details.offerId)]);
          await fetch(`${API_BASE}/api/db/escrows`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chainEscrowId: Number(escrowId), listingId: Number(listingId),
              buyer: e.details.buyer, farmer: e.details.farmer,
              amount: Number(ethers.formatEther(e.details.amount)),
              quantity: Number(qty), status: 'PENDING'
            })
          });
        }
      } catch (err) { console.error("DB Sync:", err); }

      await loadListings();
      toast.success("✅ Offer accepted! Escrow created.");
    } catch (e) {
      handleTxError(e, 'Accept offer');
    } finally { setLoading(false); }
  };

  const depositFunds = async (escrowId, amount) => {
    try {
      setLoading(true);
      await sendContractTx('depositFunds', [escrowId], { gasLimit: 300000, value: ethers.parseEther(amount) });
      toast.success("✅ Funds deposited!");
      loadListings();
    } catch (e) {
      handleTxError(e, 'Deposit');
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!contract) return;
    loadListings();
    const id = setInterval(loadListings, 15000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contract]);

  if (!account) { return null; }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-brand-green font-playfair mb-4">
          🛒 Marketplace
        </h1>
        <p className="text-lg text-brand-muted">Browse crops and make offers directly to farmers</p>
      </motion.div>

      {/* Action Buttons — role-aware */}
      <div className="flex justify-center space-x-4 mb-10">
        {role !== 'buyer' && (
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/create')}
            className="flex items-center space-x-2 bg-white text-brand-green border-2 border-green-100 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md"
          ><span>🌾</span><span>Sell My Crops</span></motion.button>
        )}
        <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/history')}
          className="flex items-center space-x-2 bg-white text-brand-gold border-2 border-amber-100 px-6 py-3 rounded-xl font-semibold shadow-sm hover:shadow-md"
        ><span>📜</span><span>My Trades</span></motion.button>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="text-center py-20">
          <span className="text-6xl mb-4 block">🌾</span>
          <p className="text-xl text-gray-600">No active listings found.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {listings.map((listing) => {
            const escrow = escrows[listing.id];
            const catColor = CATEGORY_COLORS[listing.category] || CATEGORY_COLORS.Other;
            return (
              <motion.div key={listing.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100 hover:shadow-2xl transition-all"
              >
                {/* Crop Image */}
                {listing.imageHash && (
                  <div className="h-48 bg-gray-100 overflow-hidden">
                    <img src={`${IPFS_GATEWAY}/${listing.imageHash}`} alt={listing.crop}
                      className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                  </div>
                )}

                <div className="p-6">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-2xl font-bold text-gray-800">{listing.crop}</h3>
                        <span className={`px-3 py-0.5 rounded-full text-xs font-bold ${catColor.bg} ${catColor.text}`}>
                          {listing.category}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-gray-500 text-sm">
                        <span>📍 {listing.location}</span>
                        <span>👨‍🌾 {listing.farmer.slice(0, 6)}...</span>
                      </div>
                    </div>
                    <span className={`px-4 py-1 rounded-full text-sm font-bold ${
                      listing.active ? 'bg-brand-green-pale text-brand-green' :
                      (escrow && escrow.released) ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {listing.active ? "Active" : (escrow && escrow.released) ? "Sold" : "In Escrow"}
                    </span>
                  </div>

                  {/* Description */}
                  {listing.description && (
                    <p className="text-sm text-gray-500 mb-4 line-clamp-2">{listing.description}</p>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">📦 Available</div>
                      <div className="text-lg font-bold text-gray-800">{listing.quantity} KG</div>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <div className="text-xs text-gray-500 mb-1">💰 Price</div>
                      <div className="text-lg font-bold text-brand-green">{listing.price} ETH/KG</div>
                      {ethPriceINR && (
                        <div className="text-xs text-gray-500">≈ ₹{(listing.price * ethPriceINR).toLocaleString('en-IN', { maximumFractionDigits: 2 })}/KG</div>
                      )}
                    </div>
                    {listing.harvestDate > 0 && (
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">📅 Harvested</div>
                        <div className="text-sm font-bold text-gray-800">
                          {new Date(listing.harvestDate * 1000).toLocaleDateString()}
                        </div>
                      </div>
                    )}
                    {listing.minOrderQty > 0 && (
                      <div className="bg-gray-50 p-3 rounded-xl">
                        <div className="text-xs text-gray-500 mb-1">📏 Min Order</div>
                        <div className="text-sm font-bold text-gray-800">{listing.minOrderQty} KG</div>
                      </div>
                    )}
                  </div>

                  {/* Escrow Status for Buyer */}
                  {escrow && !escrow.deposited && account.toLowerCase() === escrow.buyer.toLowerCase() && (
                    <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <h4 className="font-bold text-amber-800 mb-2">⚠️ Action Required</h4>
                      <p className="text-sm text-amber-700 mb-3">Lock your payment securely. It stays safe until you confirm delivery.</p>
                      <button onClick={() => depositFunds(escrow.id, escrow.amount)} disabled={loading}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold"
                      >{loading ? "Processing..." : `Lock Payment — ${escrow.amount} ETH`}</button>
                    </div>
                  )}

                  {escrow && escrow.deposited && account.toLowerCase() === escrow.buyer.toLowerCase() && !escrow.released && (
                    <div className="mb-4 p-4 bg-brand-green-pale border border-green-200 rounded-xl text-center">
                      <div className="font-bold text-brand-green">✅ Payment Locked Securely</div>
                      <button onClick={() => navigate('/history')} className="text-sm text-brand-green underline mt-1">
                        Track progress in My Trades →
                      </button>
                    </div>
                  )}

                  {/* Make Offer — buyers only, with INR input */}
                  {listing.active && account && account.toLowerCase() !== listing.farmer.toLowerCase() && (
                    <div className="flex flex-col gap-2 mb-4">
                      <div className="flex gap-2">
                        <input type="number" step="0.01" placeholder="Qty (KG)"
                          value={activeOfferId === listing.id ? offerQuantity : ""}
                          onChange={(e) => { setActiveOfferId(listing.id); setOfferQuantity(e.target.value); }}
                          className="w-1/3 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                        <input type="number" step="1" placeholder="Price (₹/KG)"
                          value={activeOfferId === listing.id ? offerPriceINR : ""}
                          onChange={(e) => { setActiveOfferId(listing.id); setOfferPriceINR(e.target.value); }}
                          className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:border-blue-500 outline-none"
                        />
                      </div>
                      {activeOfferId === listing.id && offerPriceINR && ethPriceINR && offerQuantity && (
                        <div className="text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                          ₹{Number(offerPriceINR).toLocaleString('en-IN')}/KG ≈ <span className="font-bold text-brand-green">{(Number(offerPriceINR) / ethPriceINR).toFixed(8)} ETH/KG</span>
                          &nbsp;| Total: <span className="font-bold">₹{(Number(offerPriceINR) * Number(offerQuantity)).toLocaleString('en-IN')}</span>
                          &nbsp;≈ <span className="font-bold text-brand-green">{((Number(offerPriceINR) * Number(offerQuantity)) / ethPriceINR).toFixed(6)} ETH</span>
                        </div>
                      )}
                      <button onClick={() => makeOffer(listing.id)}
                        disabled={loading || activeOfferId !== listing.id || !offerPriceINR || !offerQuantity}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition-all disabled:opacity-50"
                      >{loading ? "..." : "🛒 Make Offer"}</button>
                    </div>
                  )}

                  {/* Farmer sees offers */}
                  {account && account.toLowerCase() === listing.farmer.toLowerCase() && offers[listing.id]?.length > 0 && (
                    <div className="bg-brand-green-pale rounded-xl p-4 border border-green-100">
                      <h4 className="font-bold text-brand-green mb-3">💼 Offers ({offers[listing.id].length})</h4>
                      <div className="space-y-2">
                        {offers[listing.id].map((offer) => (
                          <div key={offer.index} className="bg-white p-3 rounded-lg shadow-sm border border-green-100 flex justify-between items-center">
                            <div>
                              <div className="text-sm font-bold">{offer.formattedQuantity} KG @ {offer.price} ETH/KG</div>
                              <div className="text-xs text-gray-500 font-mono">from {offer.vendor.slice(0, 8)}...</div>
                              <div className="text-xs text-brand-green font-bold">Total: {(offer.formattedQuantity * offer.price).toFixed(5)} ETH</div>
                            </div>
                            <button onClick={() => acceptOffer(listing.id, offer.index)} disabled={loading}
                              className="bg-brand-green hover:bg-green-800 text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm"
                            >Accept</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ListingsPage;
