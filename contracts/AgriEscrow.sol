// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract AgriEscrow is ReentrancyGuard {
    address public arbitrator;
    uint256 public listingCount;
    uint256 public escrowCount;
    uint256 public constant PROOF_TIMEOUT_HOURS = 24;

    modifier onlyArbitrator() {
        require(msg.sender == arbitrator, "Only arbitrator");
        _;
    }

    constructor() {
        arbitrator = msg.sender;
    }

    function setArbitrator(address _newArbitrator) external {
        arbitrator = _newArbitrator;
    }

    // ============================================
    // STRUCTS
    // ============================================

    struct Listing {
        address farmer;
        string crop;
        string category;        // Grain, Vegetable, Fruit, Spice, Pulse, Dairy, Other
        uint256 quantity;
        uint256 pricePerKg;
        string location;
        string description;     // Farming method, variety, notes
        string imageHash;       // IPFS hash of crop photo
        uint256 harvestDate;    // Unix timestamp of harvest
        uint256 minOrderQty;    // Minimum order quantity
        bool active;
    }

    struct Offer {
        address vendor;
        uint256 price;    // Price per KG
        uint256 quantity; // Quantity requested
        bool accepted;
    }

    struct EscrowDetails {
        uint256 id;
        uint256 listingId;
        uint256 offerId;
        address buyer;
        address payable farmer;
        uint256 amount;
        bool deposited;
        string ipfsProof;
    }

    struct EscrowStatus {
        uint256 proofUploadedAt;
        uint256 deliveryConfirmedAt;
        bool released;
        uint256 autoReleaseTime;
        bool proofViewedByBuyer;
        bool disputed;
        string disputeReason;
        string buyerDisputeProof;
        bool resolved;
    }

    struct Escrow {
        EscrowDetails details;
        EscrowStatus state;
    }

    // ============================================
    // STORAGE
    // ============================================

    mapping(uint256 => Listing) public listings;
    mapping(uint256 => Offer[]) public offers;
    mapping(uint256 => Escrow) public escrows;
    mapping(uint256 => uint256) public listingToEscrow;

    // ============================================
    // EVENTS
    // ============================================

    event ListingCreated(uint256 indexed id, address indexed farmer, string crop);
    event OfferMade(uint256 indexed listingId, address indexed buyer, uint256 quantity, uint256 price);
    event OfferAccepted(uint256 indexed listingId, uint256 indexed offerId, uint256 escrowId);
    event FundsDeposited(uint256 indexed escrowId, address indexed buyer, uint256 amount);
    event ProofUploaded(uint256 indexed escrowId, string ipfsHash, address indexed farmer, uint256 timestamp);
    event DeliveryConfirmed(uint256 indexed escrowId, address indexed buyer);
    event PaymentReleased(uint256 indexed escrowId, address indexed farmer, uint256 amount);
    event ForceReleased(uint256 indexed escrowId, address indexed farmer, uint256 amount);
    event ProofViewed(uint256 indexed escrowId, address indexed buyer);
    event DisputeViewed(uint256 indexed escrowId, string reason, string proof);
    event DisputeResolved(uint256 indexed escrowId, address indexed winner, uint256 amount);

    // ============================================
    // LISTING FUNCTIONS
    // ============================================

    function createListing(
        string memory _crop,
        string memory _category,
        uint256 _quantity,
        uint256 _pricePerKg,
        string memory _location,
        string memory _description,
        string memory _imageHash,
        uint256 _harvestDate,
        uint256 _minOrderQty
    ) external {
        listingCount++;
        listings[listingCount] = Listing(
            msg.sender,
            _crop,
            _category,
            _quantity,
            _pricePerKg,
            _location,
            _description,
            _imageHash,
            _harvestDate,
            _minOrderQty,
            true
        );
        emit ListingCreated(listingCount, msg.sender, _crop);
    }

    // ============================================
    // OFFER FUNCTIONS
    // ============================================

    function makeOffer(uint256 _listingId, uint256 _quantity, uint256 _price) external {
        require(listings[_listingId].active, "Listing not active");
        require(listings[_listingId].quantity >= _quantity, "Not enough stock");
        offers[_listingId].push(Offer(msg.sender, _price, _quantity, false));
        emit OfferMade(_listingId, msg.sender, _quantity, _price);
    }

    function acceptOffer(uint256 _listingId, uint256 _offerId) external {
        Listing storage l = listings[_listingId];
        require(l.farmer == msg.sender, "Only farmer");
        require(l.active, "Not active");

        Offer storage o = offers[_listingId][_offerId];
        require(!o.accepted, "Already accepted");
        require(l.quantity >= o.quantity, "Not enough stock available");

        o.accepted = true;

        // Deduct quantity
        l.quantity -= o.quantity;
        if (l.quantity == 0) {
            l.active = false;
        }

        // Calculate total amount (Price/KG * Quantity)
        uint256 totalAmount = (o.quantity * o.price) / 1e18;

        escrowCount++;
        escrows[escrowCount].details = EscrowDetails({
            id: escrowCount,
            listingId: _listingId,
            offerId: _offerId,
            buyer: o.vendor,
            farmer: payable(msg.sender),
            amount: totalAmount,
            deposited: false,
            ipfsProof: ""
        });

        escrows[escrowCount].state = EscrowStatus({
            proofUploadedAt: 0,
            deliveryConfirmedAt: 0,
            released: false,
            autoReleaseTime: 0,
            proofViewedByBuyer: false,
            disputed: false,
            disputeReason: "",
            buyerDisputeProof: "",
            resolved: false
        });

        listingToEscrow[_listingId] = escrowCount;

        emit OfferAccepted(_listingId, _offerId, escrowCount);
    }

    // ============================================
    // ESCROW FUNCTIONS
    // ============================================

    function depositFunds(uint256 _escrowId) external payable {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.details.buyer, "Only buyer");
        require(!e.details.deposited, "Already deposited");
        require(msg.value == e.details.amount, "Incorrect ETH amount");

        e.details.deposited = true;
        emit FundsDeposited(_escrowId, msg.sender, msg.value);
    }

    function uploadDeliveryProof(uint256 _escrowId, string memory _ipfsHash) external {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.details.farmer, "Only farmer");
        require(e.details.deposited, "Funds not deposited");
        require(e.state.proofUploadedAt == 0, "Proof already uploaded");
        require(!e.state.released, "Already released");

        e.details.ipfsProof = _ipfsHash;
        e.state.proofUploadedAt = block.timestamp;

        emit ProofUploaded(_escrowId, _ipfsHash, msg.sender, block.timestamp);
    }

    function confirmDelivery(uint256 _escrowId) external {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.details.buyer, "Only buyer");
        require(e.state.proofUploadedAt > 0, "No proof uploaded");
        require(e.state.deliveryConfirmedAt == 0, "Already confirmed");
        require(block.timestamp < e.state.proofUploadedAt + PROOF_TIMEOUT_HOURS * 3600, "24hr window expired");

        e.state.deliveryConfirmedAt = block.timestamp;
        e.state.autoReleaseTime = block.timestamp + 1 days;
        e.state.proofViewedByBuyer = true;

        emit DeliveryConfirmed(_escrowId, msg.sender);
    }

    // ============================================
    // DISPUTE FUNCTIONS
    // ============================================

    function disputeDelivery(uint256 _escrowId, string memory _reason, string memory _buyerProof) external {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.details.buyer, "Only buyer");
        require(e.state.proofUploadedAt > 0, "No proof");
        require(block.timestamp < e.state.proofUploadedAt + PROOF_TIMEOUT_HOURS * 3600, "Dispute window closed");
        require(!e.state.disputed, "Already disputed");

        e.state.disputed = true;
        e.state.disputeReason = _reason;
        e.state.buyerDisputeProof = _buyerProof;
        e.state.proofViewedByBuyer = true;

        emit DisputeViewed(_escrowId, _reason, _buyerProof);
    }

    function resolveDispute(uint256 _escrowId, uint256 _farmerAmount, uint256 _buyerAmount) external onlyArbitrator nonReentrant {
        Escrow storage e = escrows[_escrowId];
        require(e.state.disputed, "Not disputed");
        require(!e.state.resolved, "Already resolved");
        require(!e.state.released, "Already released");
        require(_farmerAmount + _buyerAmount == e.details.amount, "Invalid split sum");

        e.state.resolved = true;
        e.state.released = true;

        if (_farmerAmount > 0) {
            (bool sentFarmer, ) = e.details.farmer.call{value: _farmerAmount}("");
            require(sentFarmer, "Farmer pay failed");
        }

        if (_buyerAmount > 0) {
            (bool sentBuyer, ) = e.details.buyer.call{value: _buyerAmount}("");
            require(sentBuyer, "Buyer pay failed");
        }

        emit DisputeResolved(_escrowId, msg.sender, _farmerAmount);
    }

    // ============================================
    // PAYMENT RELEASE
    // ============================================

    function releasePayment(uint256 _escrowId) external nonReentrant {
        Escrow storage e = escrows[_escrowId];
        require(!e.state.released, "Already released");
        require(e.state.deliveryConfirmedAt > 0, "Delivery not confirmed");
        require(e.details.deposited, "No funds");

        bool canRelease = false;
        if (msg.sender == e.details.buyer) {
            canRelease = true;
        } else if (msg.sender == e.details.farmer && block.timestamp >= e.state.autoReleaseTime) {
            canRelease = true;
        } else if (msg.sender == e.details.farmer) {
            revert("Wait for 1-day auto-release");
        } else {
            revert("Not authorized");
        }

        require(canRelease, "Cannot release yet");

        e.state.released = true;
        (bool sent, ) = e.details.farmer.call{value: e.details.amount}("");
        require(sent, "Failed to send ETH");

        emit PaymentReleased(_escrowId, e.details.farmer, e.details.amount);
    }

    function forceReleaseAfterTimeout(uint256 _escrowId) external nonReentrant {
        Escrow storage e = escrows[_escrowId];
        require(msg.sender == e.details.farmer, "Only farmer");
        require(e.state.proofUploadedAt > 0, "No proof uploaded");
        require(e.state.deliveryConfirmedAt == 0, "Already confirmed");
        require(!e.state.disputed, "Disputed - contact support");
        require(block.timestamp >= e.state.proofUploadedAt + PROOF_TIMEOUT_HOURS * 3600, "24hrs not passed");
        require(!e.state.released, "Already released");

        e.state.released = true;
        (bool sent, ) = e.details.farmer.call{value: e.details.amount}("");
        require(sent, "Failed to send ETH");
        emit ForceReleased(_escrowId, e.details.farmer, e.details.amount);
    }

    // ============================================
    // VIEW FUNCTIONS
    // ============================================

    function getEscrowStatus(uint256 _escrowId) external view returns (
        string memory status,
        uint256 hoursLeft,
        bool canForceRelease,
        bool vendorViewed,
        bool disputed,
        string memory disputeReason,
        string memory buyerDisputeProof,
        bool resolved
    ) {
        Escrow storage e = escrows[_escrowId];

        if (e.state.resolved) return ("RESOLVED", 0, false, true, true, e.state.disputeReason, e.state.buyerDisputeProof, true);
        if (e.state.released) return ("PAID", 0, false, false, false, "", "", false);
        if (e.state.deliveryConfirmedAt > 0) return ("CONFIRMED", 0, false, true, false, "", "", false);
        if (e.state.proofUploadedAt == 0) return ("NO_PROOF", 0, false, false, false, "", "", false);

        uint256 hoursSinceProof = (block.timestamp - e.state.proofUploadedAt) / 3600;
        bool forceReady = hoursSinceProof >= PROOF_TIMEOUT_HOURS;
        uint256 hoursRemaining = forceReady ? 0 : PROOF_TIMEOUT_HOURS - hoursSinceProof;

        return (
            forceReady ? "FORCE_RELEASE_READY" : "WAITING_VENDOR",
            hoursRemaining,
            forceReady,
            e.state.proofViewedByBuyer,
            e.state.disputed,
            e.state.disputeReason,
            e.state.buyerDisputeProof,
            e.state.resolved
        );
    }

    function markProofViewed(uint256 _escrowId) external {
        require(msg.sender == escrows[_escrowId].details.buyer, "Only buyer");
        escrows[_escrowId].state.proofViewedByBuyer = true;
        emit ProofViewed(_escrowId, msg.sender);
    }

    function getListing(uint256 _id) external view returns (Listing memory) {
        return listings[_id];
    }

    function getOffers(uint256 _listingId) external view returns (
        address[] memory vendors,
        uint256[] memory prices,
        uint256[] memory quantities,
        bool[] memory accepted
    ) {
        Offer[] memory o = offers[_listingId];
        vendors = new address[](o.length);
        prices = new uint256[](o.length);
        quantities = new uint256[](o.length);
        accepted = new bool[](o.length);

        for (uint i = 0; i < o.length; i++) {
            vendors[i] = o[i].vendor;
            prices[i] = o[i].price;
            quantities[i] = o[i].quantity;
            accepted[i] = o[i].accepted;
        }
    }

    function getEscrow(uint256 _escrowId) external view returns (Escrow memory) {
        return escrows[_escrowId];
    }
}
