import { ethers } from "ethers";

// ============================================
// Single source of truth for contract config
// ============================================

export const CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512";

// Full ABI covering ALL contract functions used across the app
export const CONTRACT_ABI = [
  // === Listing Functions ===
  "function createListing(string _crop, string _category, uint256 _quantity, uint256 _pricePerKg, string _location, string _description, string _imageHash, uint256 _harvestDate, uint256 _minOrderQty)",
  "function listingCount() view returns (uint256)",
  "function getListing(uint256) view returns (tuple(address farmer, string crop, string category, uint256 quantity, uint256 pricePerKg, string location, string description, string imageHash, uint256 harvestDate, uint256 minOrderQty, bool active))",

  // === Offer Functions ===
  "function makeOffer(uint256 _listingId, uint256 _quantity, uint256 _price)",
  "function acceptOffer(uint256 _listingId, uint256 _offerId)",
  "function getOffers(uint256) view returns (address[], uint256[], uint256[], bool[])",

  // === Escrow Functions ===
  "function escrowCount() view returns (uint256)",
  "function getEscrow(uint256) view returns (tuple(tuple(uint256 id, uint256 listingId, uint256 offerId, address buyer, address farmer, uint256 amount, bool deposited, string ipfsProof) details, tuple(uint256 proofUploadedAt, uint256 deliveryConfirmedAt, bool released, uint256 autoReleaseTime, bool proofViewedByBuyer, bool disputed, string disputeReason, string buyerDisputeProof, bool resolved) state))",
  "function depositFunds(uint256) payable",
  "function uploadDeliveryProof(uint256,string)",
  "function confirmDelivery(uint256)",
  "function releasePayment(uint256)",
  "function forceReleaseAfterTimeout(uint256)",
  "function listingToEscrow(uint256) view returns (uint256)",

  // === Dispute Functions ===
  "function disputeDelivery(uint256,string,string)",
  "function resolveDispute(uint256,uint256,uint256)",
  "function markProofViewed(uint256)",
  "function getEscrowStatus(uint256) view returns (string,uint256,bool,bool,bool,string,string,bool)",

  // === Admin Functions ===
  "function arbitrator() view returns (address)",
  "function setArbitrator(address)",

  // === Events ===
  "event ListingCreated(uint256 indexed id, address indexed farmer, string crop)",
  "event OfferMade(uint256 indexed listingId, address indexed buyer, uint256 quantity, uint256 price)",
  "event OfferAccepted(uint256 indexed listingId, uint256 indexed offerId, uint256 escrowId)",
  "event FundsDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount)",
  "event ProofUploaded(uint256 indexed escrowId, string ipfsHash, address indexed farmer, uint256 timestamp)",
  "event DeliveryConfirmed(uint256 indexed escrowId, address indexed buyer)",
  "event PaymentReleased(uint256 indexed escrowId, address indexed farmer, uint256 amount)",
  "event ForceReleased(uint256 indexed escrowId, address indexed farmer, uint256 amount)",
  "event DisputeResolved(uint256 indexed escrowId, address indexed winner, uint256 amount)",
];

// Backend API base URL
export const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:5000";

// Pinata IPFS Gateway
export const IPFS_GATEWAY = "https://coral-selective-pinniped-457.mypinata.cloud/ipfs";

// Crop categories
export const CROP_CATEGORIES = [
  "Grain",
  "Vegetable",
  "Fruit",
  "Spice",
  "Pulse",
  "Dairy",
  "Other",
];

// Category colors for badges
export const CATEGORY_COLORS = {
  Grain: { bg: "bg-amber-100", text: "text-amber-700" },
  Vegetable: { bg: "bg-green-100", text: "text-green-700" },
  Fruit: { bg: "bg-pink-100", text: "text-pink-700" },
  Spice: { bg: "bg-red-100", text: "text-red-700" },
  Pulse: { bg: "bg-orange-100", text: "text-orange-700" },
  Dairy: { bg: "bg-blue-100", text: "text-blue-700" },
  Other: { bg: "bg-gray-100", text: "text-gray-700" },
};

// Agricultural transport methods (realistic Indian farming)
export const TRANSPORT_METHODS = [
  { id: "tractor", label: "🚜 Tractor + Trailer", desc: "Common for grains, sugarcane" },
  { id: "truck", label: "🚛 Hired Truck", desc: "Long-distance bulk transport" },
  { id: "tempo", label: "🚐 Tempo / Mini-Truck", desc: "Medium range, vegetables & fruits" },
  { id: "pickup", label: "🛻 Pickup Van", desc: "Short-medium range, perishables" },
  { id: "auto", label: "🛺 Auto-Rickshaw", desc: "Short range, small quantities" },
  { id: "bullock", label: "🐂 Bullock Cart", desc: "Traditional, short distance" },
  { id: "bike", label: "🏍️ Bike / Personal Vehicle", desc: "Very small quantities" },
  { id: "buyer_pickup", label: "🤝 Buyer Self-Pickup", desc: "Buyer collects from farm" },
];

// Pickup point options
export const PICKUP_POINTS = [
  "Farm Gate",
  "Village Collection Center",
  "APMC Mandi",
  "FPO Warehouse",
  "Cold Storage Facility",
  "Roadside Pickup",
  "Other",
];

// Helper: create contract instance
export const getContract = (signer) => {
  return new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
};
