// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/// @title OrbiTrustRegistry
/// @notice Portable trust layer for social-commerce sellers.
///         Reputation is built from completed, verifiable TrustOrders, not
///         standalone reviews. A review only counts when it is linked to a
///         commercial operation that buyer and seller both confirmed.
/// @dev    v2 adds EIP-712 meta-transactions so OrbiTrust can sponsor gas:
///         a relayer submits the transaction and pays gas, while the on-chain
///         actor (seller or buyer) is recovered from the signature. There is no
///         trusted `onlyRelayer` shortcut — anyone can submit a valid signed
///         action, the contract always attributes it to the real signer.
///         Still no escrow, no payments, no tokens.
contract OrbiTrustRegistry is EIP712 {
    using ECDSA for bytes32;

    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    enum OrderStatus {
        Created,
        Accepted,
        Fulfilled,
        Completed,
        Cancelled
    }

    struct Seller {
        address owner;
        string handle;
        string metadataURI;
        uint256 completedSales;
        uint256 reviewsCount;
        uint256 ratingSum;
        bool exists;
    }

    struct TrustOrder {
        uint256 id;
        address seller;
        address buyer;
        uint256 amount;
        string metadataHash;
        OrderStatus status;
        bool reviewed;
        uint256 createdAt;
    }

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    mapping(address => Seller) public sellers;
    mapping(uint256 => TrustOrder) public orders;
    mapping(address => uint256[]) private sellerOrders;
    uint256 public nextOrderId;

    /// @notice Per-actor signature nonce. Anti-replay for meta-transactions.
    mapping(address => uint256) public nonces;

    // ---------------------------------------------------------------------
    // EIP-712 typed-data hashes (one per sponsored action)
    // ---------------------------------------------------------------------

    bytes32 private constant REGISTER_SELLER_TYPEHASH =
        keccak256("RegisterSeller(string handle,string metadataURI,uint256 nonce)");
    bytes32 private constant CREATE_ORDER_TYPEHASH =
        keccak256("CreateOrder(address buyer,uint256 amount,string metadataHash,uint256 nonce)");
    bytes32 private constant ACCEPT_ORDER_TYPEHASH =
        keccak256("AcceptOrder(uint256 orderId,uint256 nonce)");
    bytes32 private constant MARK_FULFILLED_TYPEHASH =
        keccak256("MarkFulfilled(uint256 orderId,uint256 nonce)");
    bytes32 private constant CONFIRM_RECEIVED_TYPEHASH =
        keccak256("ConfirmReceived(uint256 orderId,uint256 nonce)");
    bytes32 private constant CANCEL_ORDER_TYPEHASH =
        keccak256("CancelOrder(uint256 orderId,uint256 nonce)");
    bytes32 private constant LEAVE_REVIEW_TYPEHASH =
        keccak256("LeaveReview(uint256 orderId,uint8 rating,string reviewHash,uint256 nonce)");

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event SellerRegistered(address indexed seller, string handle, string metadataURI);
    event OrderCreated(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        uint256 amount,
        string metadataHash
    );
    event OrderAccepted(uint256 indexed orderId);
    event OrderFulfilled(uint256 indexed orderId);
    event OrderCompleted(uint256 indexed orderId);
    event OrderCancelled(uint256 indexed orderId);
    event ReviewLeft(
        uint256 indexed orderId,
        address indexed seller,
        address indexed buyer,
        uint8 rating,
        string reviewHash
    );

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error SellerAlreadyRegistered();
    error SellerNotRegistered();
    error OrderNotFound();
    error NotOrderSeller();
    error NotOrderBuyer();
    error InvalidOrderStatus();
    error AlreadyReviewed();
    error InvalidRating();
    error InvalidBuyer();
    error InvalidHandle();
    error InvalidNonce();

    constructor() EIP712("OrbiTrust", "1") {}

    // ---------------------------------------------------------------------
    // Meta-transaction helpers
    // ---------------------------------------------------------------------

    /// @dev Recovers the typed-data signer for `structHash`.
    function _recoverSigner(bytes32 structHash, bytes calldata signature)
        internal
        view
        returns (address)
    {
        return _hashTypedDataV4(structHash).recover(signature);
    }

    /// @dev Consumes the expected nonce for `actor`; reverts on mismatch.
    ///      Reverting before the action runs means a failed action consumes no
    ///      nonce, so the signature can be safely re-tried with the same value.
    function _useNonce(address actor, uint256 providedNonce) internal {
        if (providedNonce != nonces[actor]) revert InvalidNonce();
        unchecked {
            nonces[actor] = providedNonce + 1;
        }
    }

    /// @dev Orders are created with sequential ids starting at 0 and are never
    ///      deleted, so any id >= nextOrderId does not exist.
    function _requireOrderExists(uint256 orderId) internal view {
        if (orderId >= nextOrderId) revert OrderNotFound();
    }

    // ---------------------------------------------------------------------
    // Seller registration
    // ---------------------------------------------------------------------

    function registerSeller(string calldata handle, string calldata metadataURI) external {
        _registerSeller(msg.sender, handle, metadataURI);
    }

    /// @notice Gas-sponsored registration. The relayer submits; `nonce` and
    ///         `signature` prove the seller authorised this exact handle.
    function registerSellerWithSignature(
        string calldata handle,
        string calldata metadataURI,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(
            abi.encode(
                REGISTER_SELLER_TYPEHASH,
                keccak256(bytes(handle)),
                keccak256(bytes(metadataURI)),
                nonce
            )
        );
        address seller = _recoverSigner(structHash, signature);
        _useNonce(seller, nonce);
        _registerSeller(seller, handle, metadataURI);
    }

    function _registerSeller(
        address seller,
        string calldata handle,
        string calldata metadataURI
    ) internal {
        if (sellers[seller].exists) revert SellerAlreadyRegistered();
        if (bytes(handle).length == 0) revert InvalidHandle();

        sellers[seller] = Seller({
            owner: seller,
            handle: handle,
            metadataURI: metadataURI,
            completedSales: 0,
            reviewsCount: 0,
            ratingSum: 0,
            exists: true
        });

        emit SellerRegistered(seller, handle, metadataURI);
    }

    // ---------------------------------------------------------------------
    // Order lifecycle
    // ---------------------------------------------------------------------

    function createOrder(
        address buyer,
        uint256 amount,
        string calldata metadataHash
    ) external returns (uint256) {
        return _createOrder(msg.sender, buyer, amount, metadataHash);
    }

    /// @notice Gas-sponsored order creation, signed by the seller.
    function createOrderWithSignature(
        address buyer,
        uint256 amount,
        string calldata metadataHash,
        uint256 nonce,
        bytes calldata signature
    ) external returns (uint256) {
        bytes32 structHash = keccak256(
            abi.encode(
                CREATE_ORDER_TYPEHASH,
                buyer,
                amount,
                keccak256(bytes(metadataHash)),
                nonce
            )
        );
        address seller = _recoverSigner(structHash, signature);
        _useNonce(seller, nonce);
        return _createOrder(seller, buyer, amount, metadataHash);
    }

    function _createOrder(
        address seller,
        address buyer,
        uint256 amount,
        string calldata metadataHash
    ) internal returns (uint256) {
        if (!sellers[seller].exists) revert SellerNotRegistered();
        if (buyer == address(0)) revert InvalidBuyer();
        if (buyer == seller) revert InvalidBuyer();

        uint256 orderId = nextOrderId;
        orders[orderId] = TrustOrder({
            id: orderId,
            seller: seller,
            buyer: buyer,
            amount: amount,
            metadataHash: metadataHash,
            status: OrderStatus.Created,
            reviewed: false,
            createdAt: block.timestamp
        });
        sellerOrders[seller].push(orderId);

        unchecked {
            nextOrderId = orderId + 1;
        }

        emit OrderCreated(orderId, seller, buyer, amount, metadataHash);
        return orderId;
    }

    /// @notice Buyer accepts a freshly created order.
    function acceptOrder(uint256 orderId) external {
        _acceptOrder(msg.sender, orderId);
    }

    function acceptOrderWithSignature(
        uint256 orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(abi.encode(ACCEPT_ORDER_TYPEHASH, orderId, nonce));
        address buyer = _recoverSigner(structHash, signature);
        _useNonce(buyer, nonce);
        _acceptOrder(buyer, orderId);
    }

    function _acceptOrder(address actor, uint256 orderId) internal {
        _requireOrderExists(orderId);
        TrustOrder storage o = orders[orderId];
        if (actor != o.buyer) revert NotOrderBuyer();
        if (o.status != OrderStatus.Created) revert InvalidOrderStatus();

        o.status = OrderStatus.Accepted;
        emit OrderAccepted(orderId);
    }

    /// @notice Seller marks an accepted order as fulfilled (shipped / handed over).
    function markFulfilled(uint256 orderId) external {
        _markFulfilled(msg.sender, orderId);
    }

    function markFulfilledWithSignature(
        uint256 orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(abi.encode(MARK_FULFILLED_TYPEHASH, orderId, nonce));
        address seller = _recoverSigner(structHash, signature);
        _useNonce(seller, nonce);
        _markFulfilled(seller, orderId);
    }

    function _markFulfilled(address actor, uint256 orderId) internal {
        _requireOrderExists(orderId);
        TrustOrder storage o = orders[orderId];
        if (actor != o.seller) revert NotOrderSeller();
        if (o.status != OrderStatus.Accepted) revert InvalidOrderStatus();

        o.status = OrderStatus.Fulfilled;
        emit OrderFulfilled(orderId);
    }

    /// @notice Buyer confirms reception. This is the moment a sale becomes real
    ///         reputation: it increments the seller's completed sales.
    function confirmReceived(uint256 orderId) external {
        _confirmReceived(msg.sender, orderId);
    }

    function confirmReceivedWithSignature(
        uint256 orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(abi.encode(CONFIRM_RECEIVED_TYPEHASH, orderId, nonce));
        address buyer = _recoverSigner(structHash, signature);
        _useNonce(buyer, nonce);
        _confirmReceived(buyer, orderId);
    }

    function _confirmReceived(address actor, uint256 orderId) internal {
        _requireOrderExists(orderId);
        TrustOrder storage o = orders[orderId];
        if (actor != o.buyer) revert NotOrderBuyer();
        if (o.status != OrderStatus.Fulfilled) revert InvalidOrderStatus();

        o.status = OrderStatus.Completed;

        unchecked {
            sellers[o.seller].completedSales += 1;
        }

        emit OrderCompleted(orderId);
    }

    /// @notice Seller can cancel an order any time before it is completed.
    function cancelOrder(uint256 orderId) external {
        _cancelOrder(msg.sender, orderId);
    }

    function cancelOrderWithSignature(
        uint256 orderId,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(abi.encode(CANCEL_ORDER_TYPEHASH, orderId, nonce));
        address seller = _recoverSigner(structHash, signature);
        _useNonce(seller, nonce);
        _cancelOrder(seller, orderId);
    }

    function _cancelOrder(address actor, uint256 orderId) internal {
        _requireOrderExists(orderId);
        TrustOrder storage o = orders[orderId];
        if (actor != o.seller) revert NotOrderSeller();
        if (o.status == OrderStatus.Completed || o.status == OrderStatus.Cancelled) {
            revert InvalidOrderStatus();
        }

        o.status = OrderStatus.Cancelled;
        emit OrderCancelled(orderId);
    }

    // ---------------------------------------------------------------------
    // Reviews
    // ---------------------------------------------------------------------

    /// @notice Buyer leaves a verified review. Completes the sale in the same
    ///         step when the order is still open (Created / Accepted / Fulfilled).
    ///         Receiving a review link implies the buyer got the product.
    function leaveReview(uint256 orderId, uint8 rating, string calldata reviewHash) external {
        _leaveReview(msg.sender, orderId, rating, reviewHash);
    }

    function leaveReviewWithSignature(
        uint256 orderId,
        uint8 rating,
        string calldata reviewHash,
        uint256 nonce,
        bytes calldata signature
    ) external {
        bytes32 structHash = keccak256(
            abi.encode(
                LEAVE_REVIEW_TYPEHASH,
                orderId,
                rating,
                keccak256(bytes(reviewHash)),
                nonce
            )
        );
        address buyer = _recoverSigner(structHash, signature);
        _useNonce(buyer, nonce);
        _leaveReview(buyer, orderId, rating, reviewHash);
    }

    function _leaveReview(
        address actor,
        uint256 orderId,
        uint8 rating,
        string calldata reviewHash
    ) internal {
        _requireOrderExists(orderId);
        TrustOrder storage o = orders[orderId];
        if (actor != o.buyer) revert NotOrderBuyer();
        if (o.reviewed) revert AlreadyReviewed();
        if (rating < 1 || rating > 5) revert InvalidRating();

        OrderStatus status = o.status;
        if (
            status == OrderStatus.Created ||
            status == OrderStatus.Accepted ||
            status == OrderStatus.Fulfilled
        ) {
            o.status = OrderStatus.Completed;
            unchecked {
                sellers[o.seller].completedSales += 1;
            }
            emit OrderCompleted(orderId);
        } else if (status != OrderStatus.Completed) {
            revert InvalidOrderStatus();
        }

        o.reviewed = true;
        Seller storage s = sellers[o.seller];

        unchecked {
            s.reviewsCount += 1;
            s.ratingSum += rating;
        }

        emit ReviewLeft(orderId, o.seller, actor, rating, reviewHash);
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function getSeller(address sellerAddress) external view returns (Seller memory) {
        return sellers[sellerAddress];
    }

    function getOrder(uint256 orderId) external view returns (TrustOrder memory) {
        _requireOrderExists(orderId);
        return orders[orderId];
    }

    function getSellerOrderIds(address sellerAddress) external view returns (uint256[] memory) {
        return sellerOrders[sellerAddress];
    }

    /// @notice Average rating as an integer (rounded down). 0 if no reviews.
    function getAverageRating(address sellerAddress) external view returns (uint256) {
        Seller storage s = sellers[sellerAddress];
        if (s.reviewsCount == 0) return 0;
        return s.ratingSum / s.reviewsCount;
    }

    /// @notice Trust score V1: completedSales * 10 + averageRating * 10, capped at 100.
    ///         Intentionally simple for the hackathon demo.
    function getTrustScore(address sellerAddress) external view returns (uint256) {
        Seller storage s = sellers[sellerAddress];
        if (!s.exists) return 0;

        uint256 averageRating = s.reviewsCount > 0 ? s.ratingSum / s.reviewsCount : 0;
        uint256 score = s.completedSales * 10 + averageRating * 10;
        if (score > 100) {
            score = 100;
        }
        return score;
    }

    /// @notice EIP-712 domain separator (exposed for off-chain signers / tooling).
    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }
}
