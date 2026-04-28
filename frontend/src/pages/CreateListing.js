import React, { useState, useEffect, useRef } from "react";
import { ethers } from "ethers";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useWallet } from "../context/WalletContext";
import { API_BASE, CROP_CATEGORIES, getContract } from "../constants/contract";

// Indian locations for autocomplete
const INDIAN_LOCATIONS = [
  "Amritsar, Punjab", "Agra, Uttar Pradesh", "Ahmedabad, Gujarat",
  "Bangalore, Karnataka", "Bhopal, Madhya Pradesh", "Bhubaneswar, Odisha",
  "Chandigarh, Punjab", "Chennai, Tamil Nadu", "Coimbatore, Tamil Nadu",
  "Dehradun, Uttarakhand", "Delhi, NCR", "Gandhinagar, Gujarat",
  "Guwahati, Assam", "Hyderabad, Telangana", "Indore, Madhya Pradesh",
  "Jaipur, Rajasthan", "Jodhpur, Rajasthan", "Kanpur, Uttar Pradesh",
  "Kochi, Kerala", "Kolkata, West Bengal", "Lucknow, Uttar Pradesh",
  "Ludhiana, Punjab", "Madurai, Tamil Nadu", "Mumbai, Maharashtra",
  "Mysore, Karnataka", "Nagpur, Maharashtra", "Nashik, Maharashtra",
  "Patna, Bihar", "Pune, Maharashtra", "Raipur, Chhattisgarh",
  "Rajkot, Gujarat", "Ranchi, Jharkhand", "Salem, Tamil Nadu",
  "Shimla, Himachal Pradesh", "Srinagar, Jammu & Kashmir",
  "Surat, Gujarat", "Thiruvananthapuram, Kerala", "Udaipur, Rajasthan",
  "Varanasi, Uttar Pradesh", "Vijayawada, Andhra Pradesh",
  "Visakhapatnam, Andhra Pradesh", "Warangal, Telangana",
];

// Common Indian crops for autocomplete
const COMMON_CROPS = [
  "Basmati Rice", "Non-Basmati Rice", "Wheat", "Jowar (Sorghum)", "Bajra (Millet)",
  "Maize (Corn)", "Ragi (Finger Millet)", "Barley",
  "Alphonso Mango", "Kesar Mango", "Banana", "Guava", "Papaya", "Pomegranate",
  "Orange", "Apple", "Grapes", "Watermelon", "Coconut", "Litchi",
  "Tomato", "Onion", "Potato", "Brinjal", "Cabbage", "Cauliflower",
  "Spinach (Palak)", "Lady Finger (Bhindi)", "Green Peas", "Carrot", "Cucumber",
  "Capsicum", "Drumstick (Moringa)", "Bitter Gourd", "Bottle Gourd",
  "Sugarcane", "Cotton", "Jute", "Groundnut", "Soybean", "Mustard",
  "Sunflower Seeds", "Sesame (Til)", "Flaxseed",
  "Turmeric (Haldi)", "Chilli", "Black Pepper", "Cardamom", "Cumin (Jeera)",
  "Coriander", "Ginger", "Garlic", "Fenugreek (Methi)",
  "Toor Dal", "Chana Dal", "Moong Dal", "Urad Dal", "Masoor Dal",
  "Milk", "Ghee", "Paneer", "Curd (Dahi)",
  "Tea Leaves", "Coffee Beans", "Cashew", "Arecanut (Supari)",
];

function CreateListing() {
  const navigate = useNavigate();
  const { account, signer } = useWallet();
  const [contract, setContract] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form state (controlled) — fixes hidden-step submission issue
  const [crop, setCrop] = useState("");
  const [category, setCategory] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [priceINR, setPriceINR] = useState("");
  const [minOrderQty, setMinOrderQty] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [imageHash, setImageHash] = useState("");

  // ETH price for INR conversion
  const [ethPriceINR, setEthPriceINR] = useState(null);
  const [ethLoading, setEthLoading] = useState(true);

  // Location autocomplete
  const [locSuggestions, setLocSuggestions] = useState([]);
  const [showLocDropdown, setShowLocDropdown] = useState(false);
  const locRef = useRef(null);

  // Crop autocomplete
  const [cropSuggestions, setCropSuggestions] = useState([]);
  const [showCropDropdown, setShowCropDropdown] = useState(false);
  const cropRef = useRef(null);

  useEffect(() => {
    if (signer) setContract(getContract(signer));
  }, [signer]);

  // Fetch live ETH price in INR
  useEffect(() => {
    const fetchPrice = async () => {
      try {
        setEthLoading(true);
        const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=inr");
        const data = await res.json();
        setEthPriceINR(data.ethereum.inr);
      } catch (e) {
        console.error("ETH price fetch failed:", e);
        setEthPriceINR(200000); // fallback
        toast.warning("Could not fetch live ETH price. Using estimate ₹2,00,000.");
      } finally { setEthLoading(false); }
    };
    fetchPrice();
    const id = setInterval(fetchPrice, 60000); // refresh every minute
    return () => clearInterval(id);
  }, []);

  // Compute ETH price from INR
  const priceETH = priceINR && ethPriceINR ? (Number(priceINR) / ethPriceINR).toFixed(8) : "";
  const totalETH = priceETH && quantity ? (Number(priceETH) * Number(quantity)).toFixed(6) : "";

  // Location autocomplete handler
  const handleLocationChange = (val) => {
    setLocation(val);
    if (val.length >= 2) {
      const filtered = INDIAN_LOCATIONS.filter(loc => loc.toLowerCase().includes(val.toLowerCase()));
      setLocSuggestions(filtered);
      setShowLocDropdown(filtered.length > 0);
    } else { setShowLocDropdown(false); }
  };

  // Crop autocomplete handler
  const handleCropChange = (val) => {
    setCrop(val);
    if (val.length >= 2) {
      const filtered = COMMON_CROPS.filter(c => c.toLowerCase().includes(val.toLowerCase()));
      setCropSuggestions(filtered);
      setShowCropDropdown(filtered.length > 0);
    } else { setShowCropDropdown(false); }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (locRef.current && !locRef.current.contains(e.target)) setShowLocDropdown(false);
      if (cropRef.current && !cropRef.current.contains(e.target)) setShowCropDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!contract) return toast.error("Connect wallet first");
    if (!crop || !category || !location || !quantity || !priceINR) {
      return toast.warning("Please fill all required fields");
    }
    if (!priceETH || Number(priceETH) <= 0) {
      return toast.warning("Price conversion failed. Check ETH rate.");
    }
    try {
      setLoading(true);
      const qtyWei = ethers.parseEther(quantity);
      const priceWei = ethers.parseEther(priceETH);
      const harvestTs = harvestDate ? Math.floor(new Date(harvestDate).getTime() / 1000) : 0;
      const minQtyWei = minOrderQty ? ethers.parseEther(minOrderQty) : ethers.parseEther("0");

      console.log("[AgriHandshake] Creating listing:", { crop, category, qty: quantity, priceETH, location });

      // Encode the function call manually to avoid ethers simulation issues
      const iface = contract.interface;
      const calldata = iface.encodeFunctionData("createListing", [
        crop, category, qtyWei, priceWei, location,
        description || "", imageHash || "", harvestTs, minQtyWei,
      ]);

      // Send raw transaction via signer (bypasses ethers eth_call simulation)
      const address = await signer.getAddress();
      const nonce = await signer.provider.getTransactionCount(address, "latest");
      console.log("[AgriHandshake] createListing using nonce:", nonce);
      const tx = await signer.sendTransaction({
        to: await contract.getAddress(),
        data: calldata,
        gasLimit: 800000,
        nonce: nonce,
      });

      console.log("[AgriHandshake] TX sent:", tx.hash);
      const receipt = await tx.wait();
      console.log("[AgriHandshake] TX confirmed, block:", receipt.blockNumber);

      // DB sync
      try {
        await fetch(`${API_BASE}/api/db/listings`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            farmer: account, crop, category,
            quantity: Number(quantity), price: Number(priceETH),
            location, description, imageHash,
            harvestDate: harvestDate || null, minOrderQty: Number(minOrderQty) || 0,
            active: true
          })
        });
      } catch (err) { console.error("DB Sync failed", err); }

      toast.success("✅ Listing published!");
      setTimeout(() => navigate('/listings'), 1500);
    } catch (err) {
      console.error("Publish error (full):", err);
      console.error("Inner error:", err.error);
      console.error("Info:", err.info);
      // Extract a human-readable error message
      let msg = "Transaction failed. Check browser console for details.";
      if (err.code === 4001 || err.code === "ACTION_REJECTED") msg = "Transaction rejected in MetaMask.";
      else if (err.code === -32000 || (err.message && err.message.includes("nonce")))
        msg = "Nonce error — go to MetaMask → Settings → Advanced → Clear activity data, then try again.";
      else if (err.reason) msg = err.reason;
      else if (err.shortMessage) msg = err.shortMessage;
      else if (err.message && err.message.length < 200) msg = err.message;
      toast.error(msg);
    } finally { setLoading(false); }
  };

  if (!account) return null;

  const inputClass = "w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-brand-green focus:ring-2 focus:ring-green-200 transition-all outline-none text-base";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-10">
        <h1 className="text-4xl sm:text-5xl font-bold text-brand-green font-playfair mb-4">🌾 List Your Crops</h1>
        <p className="text-lg text-brand-muted max-w-2xl mx-auto">Fill in the details below. Buyers will see your listing on the marketplace.</p>
      </motion.div>

      {/* Step Indicator */}
      <div className="flex justify-center mb-10">
        <div className="flex items-center space-x-4">
          {[{ num: 1, label: "Crop Info" }, { num: 2, label: "Pricing" }, { num: 3, label: "Photo" }].map((s) => (
            <div key={s.num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                step >= s.num ? 'bg-brand-green text-white shadow-lg' : 'bg-gray-200 text-gray-500'
              }`}>{step > s.num ? '✓' : s.num}</div>
              <span className={`ml-2 text-sm font-semibold hidden sm:inline ${step >= s.num ? 'text-brand-green' : 'text-gray-400'}`}>{s.label}</span>
              {s.num < 3 && <div className={`w-12 h-0.5 mx-3 ${step > s.num ? 'bg-brand-green' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Form */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-2xl mx-auto bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
        <div className="bg-brand-green p-6 text-center">
          <span className="text-4xl mb-2 block">🚜</span>
          <h2 className="text-2xl font-bold text-white">Enter Crop Details</h2>
          {ethPriceINR && !ethLoading && (
            <p className="text-green-200 text-xs mt-1">Live ETH Rate: ₹{ethPriceINR.toLocaleString('en-IN')}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {/* === Step 1: Crop Info === */}
          <div className={step === 1 ? '' : 'hidden'}>
            <div className="space-y-5">
              <div className="space-y-2 relative" ref={cropRef}>
                <label className="text-sm font-bold text-gray-700 ml-1">🏷️ Crop Name <span className="text-red-400">*</span></label>
                <input value={crop}
                  onChange={(e) => handleCropChange(e.target.value)}
                  onFocus={() => crop.length >= 2 && cropSuggestions.length > 0 && setShowCropDropdown(true)}
                  placeholder="Start typing... e.g. Basmati Rice, Tomato"
                  className={inputClass} />
                {showCropDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {cropSuggestions.map((c, i) => (
                      <button key={i} type="button"
                        onClick={() => { setCrop(c); setShowCropDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand-green-pale text-sm transition-colors border-b border-gray-50 last:border-0">
                        🌾 {c}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">📁 Category <span className="text-red-400">*</span></label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
                  <option value="">Select a category</option>
                  {CROP_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>

              {/* Location with autocomplete */}
              <div className="space-y-2 relative" ref={locRef}>
                <label className="text-sm font-bold text-gray-700 ml-1">📍 Location <span className="text-red-400">*</span></label>
                <input value={location}
                  onChange={(e) => handleLocationChange(e.target.value)}
                  onFocus={() => location.length >= 2 && locSuggestions.length > 0 && setShowLocDropdown(true)}
                  placeholder="Start typing... e.g. Pune, Mumbai, Delhi"
                  className={inputClass} />
                {showLocDropdown && (
                  <div className="absolute z-20 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {locSuggestions.map((loc, i) => (
                      <button key={i} type="button"
                        onClick={() => { setLocation(loc); setShowLocDropdown(false); }}
                        className="w-full text-left px-4 py-2.5 hover:bg-brand-green-pale text-sm transition-colors border-b border-gray-50 last:border-0">
                        📍 {loc}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">📝 Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
                  placeholder="Tell buyers about your crop — variety, farming method, special qualities..."
                  className={`${inputClass} resize-none`} />
              </div>
            </div>
            <button type="button" disabled={!crop || !category || !location}
              onClick={() => setStep(2)}
              className="w-full mt-6 py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-green-800 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">
              Next: Pricing →
            </button>
          </div>

          {/* === Step 2: Pricing with INR → ETH === */}
          <div className={step === 2 ? '' : 'hidden'}>
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">📦 Total Quantity (KG) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={quantity} onChange={(e) => setQuantity(e.target.value)}
                    placeholder="e.g. 500" className={inputClass} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">💰 Price per KG (₹) <span className="text-red-400">*</span></label>
                  <input type="number" step="0.01" value={priceINR} onChange={(e) => setPriceINR(e.target.value)}
                    placeholder="e.g. 50" className={inputClass} />
                </div>
              </div>

              {/* Live Conversion Display */}
              {priceINR && ethPriceINR && (
                <div className="bg-brand-green-pale border border-green-200 rounded-xl p-4">
                  <div className="text-xs font-bold text-brand-green mb-2 uppercase tracking-wider">Live Conversion</div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-brand-muted">Per KG in ETH</div>
                      <div className="text-lg font-bold text-brand-green">{priceETH} ETH</div>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-green-100">
                      <div className="text-xs text-brand-muted">Total ({quantity || 0} KG)</div>
                      <div className="text-lg font-bold text-brand-gold">{totalETH || '0'} ETH</div>
                    </div>
                  </div>
                  <p className="text-xs text-brand-muted mt-2">1 ETH = ₹{ethPriceINR.toLocaleString('en-IN')} (updates every minute)</p>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">📏 Minimum Order Quantity (KG)</label>
                <input type="number" step="0.01" value={minOrderQty} onChange={(e) => setMinOrderQty(e.target.value)}
                  placeholder="e.g. 10 (leave empty for no minimum)" className={inputClass} />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">📅 Harvest Date</label>
                <input type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} className={inputClass} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(1)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">← Back</button>
              <button type="button" disabled={!quantity || !priceINR}
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:bg-green-800 transition-all text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                Next: Photo →
              </button>
            </div>
          </div>

          {/* === Step 3: Photo & Submit === */}
          <div className={step === 3 ? '' : 'hidden'}>
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 ml-1">📸 Crop Photo (optional)</label>
                <input value={imageHash} onChange={(e) => setImageHash(e.target.value)}
                  placeholder="Paste your IPFS CID here (e.g. QmXyz...)"
                  className={`${inputClass} font-mono text-sm`} />
                <p className="text-xs text-gray-400 ml-1">Upload your photo to IPFS (e.g. via Pinata) and paste the hash here.</p>
              </div>

              {/* Summary */}
              <div className="bg-brand-green-pale border border-green-200 rounded-2xl p-5">
                <h4 className="font-bold text-brand-green mb-3">📋 Listing Summary</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-brand-muted">Crop:</span> <span className="font-semibold">{crop}</span></div>
                  <div><span className="text-brand-muted">Category:</span> <span className="font-semibold">{category}</span></div>
                  <div><span className="text-brand-muted">Location:</span> <span className="font-semibold">{location}</span></div>
                  <div><span className="text-brand-muted">Quantity:</span> <span className="font-semibold">{quantity} KG</span></div>
                  <div><span className="text-brand-muted">Price:</span> <span className="font-semibold">₹{priceINR}/KG</span></div>
                  <div><span className="text-brand-muted">In ETH:</span> <span className="font-semibold text-brand-green">{priceETH} ETH/KG</span></div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => setStep(2)} className="flex-1 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-all">← Back</button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                type="submit" disabled={loading}
                className="flex-[2] py-4 bg-brand-green text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-70 disabled:cursor-not-allowed text-lg">
                {loading ? "⏳ Publishing..." : "✅ Publish Listing"}
              </motion.button>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default CreateListing;
