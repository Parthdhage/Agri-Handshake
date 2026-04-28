import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletContext";
import { API_BASE, IPFS_GATEWAY, TRANSPORT_METHODS, PICKUP_POINTS, getContract } from "../constants/contract";

// Status step config — shows what happened and what's next
const STATUS_STEPS = [
  { key: "PENDING", label: "Escrow Created", icon: "📋", farmerNext: "Wait for buyer to deposit funds.", buyerNext: "Deposit funds to lock them in escrow." },
  { key: "DEPOSITED", label: "Funds Deposited", icon: "💰", farmerNext: "Ship the crop and upload delivery proof + transport details.", buyerNext: "Wait for the farmer to ship and upload proof." },
  { key: "PROOF_UPLOADED", label: "Proof Uploaded", icon: "📸", farmerNext: "Waiting for buyer to confirm delivery (24hr window).", buyerNext: "Review proof and confirm delivery or raise dispute." },
  { key: "CONFIRMED", label: "Delivery Confirmed", icon: "✔️", farmerNext: "Buyer confirmed! Waiting for payment transfer.", buyerNext: "Transfer payment to farmer or raise dispute." },
  { key: "RELEASED", label: "Payment Released", icon: "🎉", farmerNext: "Done! Payment received. Thank you! 🌾", buyerNext: "Done! Trade complete. 🚜" },
];

function History() {
  const navigate = useNavigate();
  const [myEscrows, setMyEscrows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [proofInput, setProofInput] = useState("");
  const [proofId, setProofId] = useState(null);
  const [isArbitrator, setIsArbitrator] = useState(false);
  const [trackingInput, setTrackingInput] = useState({});
  const [trackingData, setTrackingData] = useState({});
  const { account, signer, connectWallet } = useWallet();
  const [contract, setContract] = useState(null);

  useEffect(() => { if (signer) setContract(getContract(signer)); }, [signer]);

  // Raw transaction helper — bypasses ethers simulation + explicit nonce
  const sendContractTx = async (functionName, args, options = {}) => {
    const iface = contract.interface;
    const calldata = iface.encodeFunctionData(functionName, args);
    const address = await signer.getAddress();
    const nonce = await signer.provider.getTransactionCount(address, "latest");
    console.log(`[AgriHandshake] ${functionName} nonce:`, nonce);
    const tx = await signer.sendTransaction({
      to: await contract.getAddress(),
      data: calldata,
      gasLimit: options.gasLimit || 500000,
      nonce,
      ...(options.value ? { value: options.value } : {}),
    });
    console.log(`[AgriHandshake] ${functionName} TX:`, tx.hash);
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

  const loadTracking = useCallback(async (chainId) => {
    try {
      const res = await fetch(`${API_BASE}/api/db/escrows/chain/${chainId}/tracking`);
      if (res.ok) {
        const data = await res.json();
        setTrackingData(prev => ({ ...prev, [chainId]: data }));
      }
    } catch (e) { console.error("tracking fetch", e); }
  }, []);

  const loadData = useCallback(async () => {
    if (!contract || !account) return;
    try {
      console.log("[AgriHandshake] Loading escrows...");
      const arb = await contract.arbitrator();
      const currentIsArb = arb.toLowerCase() === account.toLowerCase();
      setIsArbitrator(currentIsArb);
      const count = Number(await contract.escrowCount());
      const all = [];
      for (let i = 1; i <= count; i++) {
        try {
          const e = await contract.getEscrow(i);
          const buyer = e.details.buyer, farmer = e.details.farmer;
          const isMine = buyer.toLowerCase() === account.toLowerCase() || farmer.toLowerCase() === account.toLowerCase();
          if (currentIsArb || isMine) {
            const [l, offersRes, statusInfo] = await Promise.all([
              contract.getListing(e.details.listingId), contract.getOffers(e.details.listingId), contract.getEscrowStatus(i)
            ]);
            const qty = ethers.formatEther(offersRes[2][Number(e.details.offerId)]);
            all.push({
              id: Number(e.details.id), listingId: Number(e.details.listingId),
              role: buyer.toLowerCase() === account.toLowerCase() ? "🛒 Buyer" : "🌾 Farmer",
              isBuyer: buyer.toLowerCase() === account.toLowerCase(),
              buyer, farmer, crop: l.crop, location: l.location, quantity: qty,
              amount: ethers.formatEther(e.details.amount), deposited: e.details.deposited,
              ipfsProof: e.details.ipfsProof, proofUploadedAt: Number(e.state.proofUploadedAt),
              deliveryConfirmedAt: Number(e.state.deliveryConfirmedAt), released: e.state.released,
              autoReleaseTime: Number(e.state.autoReleaseTime), liveStatus: statusInfo[0],
              hoursLeft: Number(statusInfo[1]), canForceRelease: statusInfo[2], vendorViewed: statusInfo[3],
              isDisputed: statusInfo[4], serverDisputeReason: statusInfo[5], buyerDisputeProof: statusInfo[6], isResolved: statusInfo[7]
            });
            await loadTracking(i);
          }
        } catch (err) { console.error("escrow", i, err); }
      }
      all.sort((a, b) => b.id - a.id);
      console.log(`[AgriHandshake] Loaded ${all.length} escrows`);
      setMyEscrows(all);
      setDataLoaded(true);
    } catch (e) { console.error("loadData", e); setDataLoaded(true); }
  }, [contract, account, loadTracking]);

  const getStatusIndex = (item) => {
    if (item.released || item.isResolved) return 4;
    if (item.deliveryConfirmedAt > 0) return 3;
    if (item.proofUploadedAt > 0) return 2;
    if (item.deposited) return 1;
    return 0;
  };

  const handleDeposit = async (id, amount) => {
    try { setLoading(true);
      await sendContractTx('depositFunds', [id], { value: ethers.parseEther(amount) });
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'DEPOSITED'}) });
      toast.success("✅ Deposited!"); loadData();
    } catch(e) { handleTxError(e, 'Deposit'); } finally { setLoading(false); }
  };

  const handleUploadProof = async (id) => {
    if (!proofInput) return toast.warning("Enter proof hash");
    try { setLoading(true);
      await sendContractTx('uploadDeliveryProof', [id, proofInput.trim()]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ipfsProof:proofInput, status:'PROOF_UPLOADED'}) });
      toast.success("✅ Proof uploaded! Buyer has 24hrs to confirm."); setProofId(null); setProofInput(""); loadData();
    } catch(e) { handleTxError(e, 'Upload proof'); } finally { setLoading(false); }
  };

  const handleSaveTracking = async (id) => {
    const input = trackingInput[id];
    if (!input?.transportMethod) return toast.warning("Select a transport method");
    try {
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}/tracking`, { method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({
          transportMethod: input.transportMethod,
          vehicleNumber: input.vehicleNumber || '',
          driverName: input.driverName || '',
          driverPhone: input.driverPhone || '',
          pickupPoint: input.pickupPoint || '',
          estimatedDelivery: input.estimatedDelivery || null,
        })
      });
      toast.success("🚜 Transport info saved!"); loadTracking(id);
      setTrackingInput(prev => ({ ...prev, [id]: {} }));
    } catch(e) { toast.error("Failed to save transport info"); }
  };

  const handleConfirm = async (id) => {
    try { setLoading(true);
      await sendContractTx('confirmDelivery', [id]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({status:'CONFIRMED', autoReleaseTime: new Date(Date.now()+86400000)}) });
      toast.success("✅ Delivery confirmed!"); loadData();
    } catch(e) { handleTxError(e, 'Confirm delivery'); } finally { setLoading(false); }
  };

  const handleDispute = async (id) => {
    const reason = prompt("Enter reason for dispute:"); if (!reason) return;
    const proof = prompt("IPFS hash for your proof (optional):") || "";
    try { setLoading(true);
      await sendContractTx('disputeDelivery', [id, reason, proof]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({status:'DISPUTED', disputeReason:reason, buyerDisputeProof:proof, disputed:true}) });
      toast.warning("⚠️ Dispute filed."); loadData();
    } catch(e) { handleTxError(e, 'Dispute'); } finally { setLoading(false); }
  };

  const handleForceRelease = async (id) => {
    try { setLoading(true);
      await sendContractTx('forceReleaseAfterTimeout', [id]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'RELEASED'}) });
      toast.success("⚡ Force released!"); loadData();
    } catch(e) { handleTxError(e, 'Force release'); } finally { setLoading(false); }
  };

  const handleRelease = async (id) => {
    try { setLoading(true);
      await sendContractTx('releasePayment', [id]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'RELEASED'}) });
      toast.success("✅ Payment released!"); loadData();
    } catch(e) { handleTxError(e, 'Release payment'); } finally { setLoading(false); }
  };

  const handleResolve = async (id, fAmt, bAmt) => {
    try { setLoading(true);
      await sendContractTx('resolveDispute', [id, ethers.parseEther(fAmt.toString()), ethers.parseEther(bAmt.toString())]);
      await fetch(`${API_BASE}/api/db/escrows/chain/${id}`, { method:'PUT', headers:{'Content-Type':'application/json'}, body: JSON.stringify({status:'RESOLVED'}) });
      toast.success("⚖️ Dispute resolved!"); loadData();
    } catch(e) { handleTxError(e, 'Resolve dispute'); } finally { setLoading(false); }
  };

  const handleMarkViewed = async (id) => {
    try {
      await sendContractTx('markProofViewed', [id]);
      loadData();
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!contract || !account) return;
    console.log("[AgriHandshake] History: loading escrows for", account);
    loadData();
    const id = setInterval(loadData, 15000);
    // Event listener — wrap in try-catch because BrowserProvider may not support it
    let onProof = null;
    try {
      onProof = () => loadData();
      contract.on("ProofUploaded", onProof);
    } catch (e) {
      console.warn("[AgriHandshake] Event subscription not supported, using polling only");
    }
    return () => {
      clearInterval(id);
      if (onProof) try { contract.off("ProofUploaded", onProof); } catch (e) {}
    };
  }, [contract, account, loadData]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-amber-600 bg-clip-text text-transparent font-playfair mb-4">
          {isArbitrator ? "⚖️ Dispute Resolution" : "📜 My Trades"}
        </h1>
        <p className="text-lg text-gray-600">
          {isArbitrator ? "Review and resolve disputes" : "Track your escrow status and next steps"}
        </p>
      </motion.div>

      {!account ? (
        <div className="text-center py-20 bg-white/50 rounded-3xl border border-gray-200">
          <span className="text-6xl mb-4 block">🔒</span>
          <h3 className="text-2xl font-bold mb-2">Connect Wallet</h3>
          <button onClick={() => navigate('/login')} className="bg-emerald-600 text-white px-10 py-4 rounded-full font-bold shadow-lg mt-4">Go to Login</button>
        </div>
      ) : (
        <div className="space-y-8">
          {myEscrows.filter(item => {
            // If user is a party (buyer or farmer), always show
            const isParty = item.buyer.toLowerCase() === account.toLowerCase() || item.farmer.toLowerCase() === account.toLowerCase();
            if (isParty) return true;
            // If user is only arbitrator (not a party), show only disputed
            if (isArbitrator) return item.isDisputed;
            return true;
          }).map((item) => {
            const statusIdx = getStatusIndex(item);
            const tracking = trackingData[item.id];
            const tInput = trackingInput[item.id] || {};

            return (
              <motion.div key={item.id} initial={{opacity:0,scale:0.98}} animate={{opacity:1,scale:1}}
                className="bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden">
                <div className="p-6 sm:p-8">
                  {/* Header */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-emerald-600 text-white px-4 py-1 rounded-full font-bold text-xs">ESCROW #{item.id}</span>
                        <span className={`px-4 py-1 rounded-full font-bold text-xs ${item.isBuyer?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700'}`}>{item.role}</span>
                        {item.isDisputed && <span className="bg-red-100 text-red-600 px-4 py-1 rounded-full font-bold text-xs">⚠️ DISPUTED</span>}
                      </div>
                      <h3 className="text-2xl font-black text-gray-900 mb-1">{item.crop}</h3>
                      <div className="flex flex-wrap gap-3 text-sm text-gray-500">
                        <span className="bg-gray-50 px-3 py-1 rounded-lg">📍 {item.location}</span>
                        <span className="bg-gray-50 px-3 py-1 rounded-lg">📦 {item.quantity} KG</span>
                        <span className="bg-emerald-50 px-3 py-1 rounded-lg text-emerald-700 font-bold">💰 {item.amount} ETH</span>
                      </div>
                    </div>
                  </div>

                  {/* ===== STATUS TRACKER ===== */}
                  <div className="bg-gray-50 rounded-2xl p-5 mb-6 border border-gray-100">
                    <h4 className="font-bold text-gray-500 text-xs uppercase tracking-widest mb-4">📊 Trade Progress</h4>
                    <div className="flex items-center justify-between mb-4">
                      {STATUS_STEPS.map((s, i) => (
                        <React.Fragment key={s.key}>
                          <div className="flex flex-col items-center text-center" style={{flex:'0 0 auto'}}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
                              i <= statusIdx ? 'bg-emerald-500 text-white shadow-lg' :
                              i === statusIdx + 1 ? 'bg-blue-100 text-blue-600 border-2 border-blue-300' :
                              'bg-gray-200 text-gray-400'
                            }`}>{i <= statusIdx ? '✓' : s.icon}</div>
                            <span className={`text-xs mt-1 font-semibold max-w-[80px] ${i<=statusIdx?'text-emerald-700':'text-gray-400'}`}>{s.label}</span>
                          </div>
                          {i < STATUS_STEPS.length - 1 && (
                            <div className={`flex-1 h-1 mx-1 rounded ${i < statusIdx ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Next step message */}
                    {!item.released && !item.isDisputed && statusIdx < STATUS_STEPS.length - 1 && (
                      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mt-2">
                        <p className="text-sm font-semibold text-blue-800">
                          👉 Next: {item.isBuyer ? STATUS_STEPS[statusIdx].buyerNext : STATUS_STEPS[statusIdx].farmerNext}
                        </p>
                      </div>
                    )}
                    {item.isDisputed && !item.isResolved && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-2">
                        <p className="text-sm font-semibold text-red-700">⚠️ Dispute in progress — waiting for arbitrator resolution.</p>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Actions */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* Deposit */}
                      {item.isBuyer && !item.deposited && (
                        <button onClick={() => handleDeposit(item.id, item.amount)} disabled={loading}
                          className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold shadow-lg hover:bg-emerald-700 text-lg">
                          💰 Deposit {item.amount} ETH
                        </button>
                      )}

                      {/* Upload Proof (Farmer) */}
                      {!item.ipfsProof && !item.isBuyer && item.deposited && (
                        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 space-y-3">
                          <h5 className="font-bold text-blue-800">📸 Upload Delivery Proof</h5>
                          <input type="text" placeholder="IPFS CID (e.g. QmXyz...)"
                            className="w-full px-4 py-2 bg-white border-2 border-blue-200 rounded-xl text-sm font-mono outline-none focus:border-blue-500"
                            value={proofId === item.id ? proofInput : ""}
                            onChange={(e) => { setProofId(item.id); setProofInput(e.target.value); }} />
                          <button onClick={() => handleUploadProof(item.id)} disabled={loading}
                            className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold">Upload Proof</button>
                        </div>
                      )}

                      {/* Transport Info (Farmer adds, buyer sees) */}
                      {item.deposited && (
                        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
                          <h5 className="font-bold text-amber-800 mb-2">🚜 Transport & Delivery</h5>
                          {tracking?.transportMethod ? (
                            <div className="space-y-2">
                              <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                <span className="text-sm text-gray-600">Transport</span>
                                <span className="font-bold text-gray-800">{TRANSPORT_METHODS.find(t => t.id === tracking.transportMethod)?.label || tracking.transportMethod}</span>
                              </div>
                              {tracking.vehicleNumber && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Vehicle No.</span>
                                  <span className="font-bold font-mono text-amber-700">{tracking.vehicleNumber}</span>
                                </div>
                              )}
                              {tracking.driverName && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Driver</span>
                                  <span className="font-bold text-gray-800">{tracking.driverName}</span>
                                </div>
                              )}
                              {tracking.driverPhone && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Driver Phone</span>
                                  <a href={`tel:${tracking.driverPhone}`} className="font-bold text-blue-600 hover:underline">📞 {tracking.driverPhone}</a>
                                </div>
                              )}
                              {tracking.pickupPoint && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Pickup</span>
                                  <span className="font-bold text-gray-800">📍 {tracking.pickupPoint}</span>
                                </div>
                              )}
                              {tracking.estimatedDelivery && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Est. Delivery</span>
                                  <span className="font-bold text-emerald-700">📅 {new Date(tracking.estimatedDelivery).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                              {tracking.shippedAt && (
                                <div className="flex justify-between bg-white p-3 rounded-xl border border-amber-100">
                                  <span className="text-sm text-gray-600">Dispatched</span>
                                  <span className="font-bold text-gray-800">{new Date(tracking.shippedAt).toLocaleDateString('en-IN')}</span>
                                </div>
                              )}
                            </div>
                          ) : !item.isBuyer ? (
                            <div className="space-y-3">
                              {/* Transport Method */}
                              <div>
                                <label className="text-xs font-bold text-amber-700 mb-1 block">Transport Method *</label>
                                <select value={tInput.transportMethod || ''}
                                  onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), transportMethod: e.target.value}}))}
                                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none">
                                  <option value="">Select transport...</option>
                                  {TRANSPORT_METHODS.map(t => <option key={t.id} value={t.id}>{t.label} — {t.desc}</option>)}
                                </select>
                              </div>
                              {/* Vehicle Number */}
                              {tInput.transportMethod && tInput.transportMethod !== 'buyer_pickup' && (
                                <div>
                                  <label className="text-xs font-bold text-amber-700 mb-1 block">Vehicle Number</label>
                                  <input type="text" placeholder="e.g. MH 12 AB 1234"
                                    value={tInput.vehicleNumber || ''}
                                    onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), vehicleNumber: e.target.value.toUpperCase()}}))}
                                    className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none font-mono" />
                                </div>
                              )}
                              {/* Driver Info */}
                              {tInput.transportMethod && tInput.transportMethod !== 'buyer_pickup' && (
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs font-bold text-amber-700 mb-1 block">Driver Name</label>
                                    <input type="text" placeholder="Driver name"
                                      value={tInput.driverName || ''}
                                      onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), driverName: e.target.value}}))}
                                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none" />
                                  </div>
                                  <div>
                                    <label className="text-xs font-bold text-amber-700 mb-1 block">Driver Phone</label>
                                    <input type="tel" placeholder="Phone number"
                                      value={tInput.driverPhone || ''}
                                      onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), driverPhone: e.target.value}}))}
                                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none font-mono" />
                                  </div>
                                </div>
                              )}
                              {/* Pickup Point */}
                              <div>
                                <label className="text-xs font-bold text-amber-700 mb-1 block">Pickup Point</label>
                                <select value={tInput.pickupPoint || ''}
                                  onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), pickupPoint: e.target.value}}))}
                                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none">
                                  <option value="">Select pickup point...</option>
                                  {PICKUP_POINTS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                              </div>
                              {/* Estimated Delivery */}
                              <div>
                                <label className="text-xs font-bold text-amber-700 mb-1 block">Estimated Delivery Date</label>
                                <input type="date"
                                  value={tInput.estimatedDelivery || ''}
                                  onChange={(e) => setTrackingInput(prev => ({...prev, [item.id]: {...(prev[item.id]||{}), estimatedDelivery: e.target.value}}))}
                                  className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl outline-none" />
                              </div>
                              <button onClick={() => handleSaveTracking(item.id)}
                                className="w-full bg-amber-500 text-white py-2.5 rounded-xl font-bold hover:bg-amber-600 mt-1">
                                🚜 Save Transport Info
                              </button>
                            </div>
                          ) : (
                            <p className="text-sm text-amber-600 italic">Farmer hasn't added transport details yet.</p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: Evidence & Actions */}
                    <div className="lg:col-span-5 space-y-4">

                      {/* === COMPLETED / RELEASED STATE === */}
                      {(item.released || item.isResolved) && (
                        <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-6 rounded-2xl border border-emerald-200 text-center">
                          <div className="text-5xl mb-3">🎉</div>
                          <h5 className="font-black text-emerald-800 text-xl mb-2">Transaction Complete!</h5>
                          {!item.isBuyer ? (
                            <div>
                              <p className="text-emerald-700 mb-2">Payment of <span className="font-bold">{item.amount} ETH</span> has been transferred to your wallet.</p>
                              <p className="text-emerald-600 text-sm">Thank you for trading on AgriHandshake! 🌾</p>
                            </div>
                          ) : (
                            <div>
                              <p className="text-emerald-700 mb-2">You've successfully paid <span className="font-bold">{item.amount} ETH</span> to the farmer.</p>
                              <p className="text-emerald-600 text-sm">Your crops are on the way! 🚜</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* === PROOF VIEW (both sides see it) === */}
                      {item.ipfsProof && !item.released && !item.isResolved && (
                        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100">
                          <h5 className="font-black text-emerald-800 mb-3">📸 DELIVERY PROOF</h5>
                          <a href={`${IPFS_GATEWAY}/${item.ipfsProof}`} target="_blank" rel="noreferrer"
                            onClick={() => item.isBuyer && handleMarkViewed(item.id)}
                            className="block text-center bg-white border-2 border-emerald-200 py-3 rounded-xl font-bold text-emerald-700 hover:bg-emerald-100 mb-3">
                            View Proof ↗
                          </a>

                          {/* FARMER: after uploading proof, just wait */}
                          {!item.isBuyer && !item.deliveryConfirmedAt && !item.isDisputed && (
                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-center">
                              <p className="text-sm font-semibold text-blue-800">⏳ Waiting for buyer to confirm delivery...</p>
                              <p className="text-xs text-blue-600 mt-1">Buyer has 24 hours to review your proof.</p>
                            </div>
                          )}

                          {/* FARMER: delivery confirmed by buyer, waiting for payment transfer */}
                          {!item.isBuyer && item.deliveryConfirmedAt > 0 && !item.released && (
                            <div className="bg-emerald-100 border border-emerald-200 rounded-xl p-3 text-center">
                              <p className="text-sm font-semibold text-emerald-800">✅ Buyer confirmed delivery!</p>
                              <p className="text-xs text-emerald-600 mt-1">Waiting for buyer to transfer payment...</p>
                            </div>
                          )}

                          {/* BUYER: confirm delivery or dispute */}
                          {item.isBuyer && !item.deliveryConfirmedAt && !item.isDisputed && (
                            <div className="space-y-2">
                              <button onClick={() => handleConfirm(item.id)} disabled={loading}
                                className="w-full bg-emerald-600 text-white py-3 rounded-xl font-black text-lg shadow-xl hover:bg-emerald-700">
                                CONFIRM DELIVERY ✅
                              </button>
                              <button onClick={() => handleDispute(item.id)} disabled={loading}
                                className="w-full bg-white border-2 border-red-200 text-red-600 py-2 rounded-xl font-bold hover:bg-red-50">
                                RAISE DISPUTE ⚠️
                              </button>
                            </div>
                          )}

                          {/* BUYER: after confirming delivery — transfer payment */}
                          {item.isBuyer && item.deliveryConfirmedAt > 0 && !item.released && !item.isDisputed && (
                            <div className="space-y-2">
                              <button onClick={() => handleRelease(item.id)} disabled={loading}
                                className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black text-lg shadow-2xl hover:bg-emerald-700">
                                💸 Transfer Payment to Farmer
                              </button>
                              <button onClick={() => handleDispute(item.id)} disabled={loading}
                                className="w-full bg-white border-2 border-red-200 text-red-600 py-2 rounded-xl font-bold hover:bg-red-50">
                                RAISE DISPUTE ⚠️
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Force Release — only farmer, only if buyer didn't respond in 24hrs */}
                      {!item.released && !item.isBuyer && item.liveStatus === "FORCE_RELEASE_READY" && !item.isDisputed && (
                        <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200">
                          <h5 className="font-black text-amber-800 mb-2">⏰ Buyer didn't respond in 24 hours</h5>
                          <p className="text-sm text-amber-700 mb-3">You can auto-release the funds to your wallet.</p>
                          <button onClick={() => handleForceRelease(item.id)} disabled={loading}
                            className="w-full bg-amber-600 text-white py-3 rounded-xl font-black text-lg shadow-xl hover:bg-amber-700">
                            Auto-Release Payment ⚡
                          </button>
                        </div>
                      )}

                      {/* Dispute Panel */}
                      {item.isDisputed && (
                        <div className="bg-red-50 p-5 rounded-2xl border border-red-200">
                          <h5 className="font-black text-red-800 mb-2">⚠️ DISPUTE</h5>
                          <p className="text-sm text-red-700 italic mb-3">"{item.serverDisputeReason}"</p>
                          {item.buyerDisputeProof && (
                            <a href={`${IPFS_GATEWAY}/${item.buyerDisputeProof}`} target="_blank" rel="noreferrer"
                              className="inline-block bg-white text-red-600 px-4 py-2 rounded-xl text-xs font-bold border border-red-200 mb-3">
                              Buyer's Proof ↗
                            </a>
                          )}
                          {isArbitrator && !item.isResolved && (
                            <div className="space-y-2 mt-3">
                              <p className="text-xs font-bold text-red-500 uppercase text-center">Arbitrator Decision</p>
                              <button onClick={() => handleResolve(item.id, item.amount, 0)}
                                className="w-full bg-emerald-600 text-white py-2 rounded-xl font-bold">100% → Farmer</button>
                              <button onClick={() => handleResolve(item.id, 0, item.amount)}
                                className="w-full bg-blue-600 text-white py-2 rounded-xl font-bold">100% → Buyer</button>
                              <button onClick={() => { const s=Number(item.amount)/2; handleResolve(item.id,s,s); }}
                                className="w-full bg-gray-800 text-white py-2 rounded-xl font-bold">50/50 Split</button>
                            </div>
                          )}
                          {item.isResolved && (
                            <div className="bg-emerald-100 p-3 rounded-xl text-emerald-800 font-bold text-center mt-2">⚖️ RESOLVED</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {isArbitrator && myEscrows.filter(e => e.isDisputed).length === 0 && myEscrows.filter(e => e.buyer.toLowerCase() === account.toLowerCase() || e.farmer.toLowerCase() === account.toLowerCase()).length === 0 && (
            <div className="text-center py-20 bg-emerald-50/50 rounded-3xl border border-emerald-100">
              <span className="text-6xl mb-4 block">⚖️</span>
              <h3 className="text-2xl font-bold text-emerald-800">No Active Disputes</h3>
            </div>
          )}
          {!isArbitrator && myEscrows.length === 0 && (
            <div className="text-center py-20 bg-gray-50/50 rounded-3xl border border-gray-100">
              {!dataLoaded ? (
                <>
                  <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-600">Loading trades from blockchain...</h3>
                </>
              ) : (
                <>
                  <span className="text-6xl mb-4 block">🌾</span>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">No Trades Yet</h3>
                  <p className="text-gray-600 mb-4">Accept offers on the Marketplace to see your trades here.</p>
                  <button onClick={() => navigate('/listings')}
                    className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-emerald-700">
                    Go to Marketplace
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default History;
