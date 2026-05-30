const { expect } = require("chai");
const { ethers } = require("hardhat");
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers");

const META = "demo:Campera negra talle M";
const REVIEW = "demo:Todo perfecto, llego rapido";

// EIP-712 typed-data definitions. These MUST match the contract type hashes
// and the shared frontend module (lib/contract/eip712.ts).
const EIP712_TYPES = {
  RegisterSeller: [
    { name: "handle", type: "string" },
    { name: "metadataURI", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
  CreateOrder: [
    { name: "buyer", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "metadataHash", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
  AcceptOrder: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  MarkFulfilled: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  ConfirmReceived: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  CancelOrder: [
    { name: "orderId", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  LeaveReview: [
    { name: "orderId", type: "uint256" },
    { name: "rating", type: "uint8" },
    { name: "reviewHash", type: "string" },
    { name: "nonce", type: "uint256" },
  ],
};

async function eip712Domain(registry) {
  const { chainId } = await ethers.provider.getNetwork();
  return {
    name: "OrbiTrust",
    version: "1",
    chainId,
    verifyingContract: await registry.getAddress(),
  };
}

async function signAction(signer, registry, primaryType, message) {
  const domain = await eip712Domain(registry);
  const types = { [primaryType]: EIP712_TYPES[primaryType] };
  return signer.signTypedData(domain, types, message);
}

describe("OrbiTrustRegistry", function () {
  async function deployFixture() {
    const [seller, buyer, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("OrbiTrustRegistry");
    const registry = await Factory.deploy();
    await registry.waitForDeployment();
    return { registry, seller, buyer, other };
  }

  async function openOrderFixture() {
    const base = await loadFixture(deployFixture);
    const { registry, seller, buyer } = base;
    await registry.connect(seller).registerSeller("ana", "ipfs://demo");
    await registry.connect(seller).createOrder(buyer.address, 1000n, META);
    return base;
  }

  async function completedOrderFixture() {
    const base = await openOrderFixture();
    const { registry, buyer } = base;
    await registry.connect(buyer).leaveReview(0, 5, REVIEW);
    return base;
  }

  async function legacyConfirmedOrderFixture() {
    const base = await openOrderFixture();
    const { registry, seller, buyer } = base;
    await registry.connect(buyer).acceptOrder(0);
    await registry.connect(seller).markFulfilled(0);
    await registry.connect(buyer).confirmReceived(0);
    return base;
  }

  describe("seller registration", () => {
    it("registers a seller and emits SellerRegistered", async () => {
      const { registry, seller } = await loadFixture(deployFixture);
      await expect(registry.connect(seller).registerSeller("tiendadeana", "ipfs://demo"))
        .to.emit(registry, "SellerRegistered")
        .withArgs(seller.address, "tiendadeana", "ipfs://demo");

      const s = await registry.getSeller(seller.address);
      expect(s.exists).to.equal(true);
      expect(s.handle).to.equal("tiendadeana");
      expect(s.completedSales).to.equal(0n);
      expect(s.reviewsCount).to.equal(0n);
    });

    it("prevents duplicate seller registration", async () => {
      const { registry, seller } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await expect(
        registry.connect(seller).registerSeller("ana2", "ipfs://demo")
      ).to.be.revertedWithCustomError(registry, "SellerAlreadyRegistered");
    });

    it("rejects an empty handle", async () => {
      const { registry, seller } = await loadFixture(deployFixture);
      await expect(
        registry.connect(seller).registerSeller("", "ipfs://demo")
      ).to.be.revertedWithCustomError(registry, "InvalidHandle");
    });
  });

  describe("order lifecycle", () => {
    it("creates an order with sequential ids", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await expect(registry.connect(seller).createOrder(buyer.address, 1000n, META))
        .to.emit(registry, "OrderCreated")
        .withArgs(0n, seller.address, buyer.address, 1000n, META);

      expect(await registry.nextOrderId()).to.equal(1n);
      const o = await registry.getOrder(0);
      expect(o.seller).to.equal(seller.address);
      expect(o.buyer).to.equal(buyer.address);
      expect(o.status).to.equal(0); // Created
    });

    it("requires a registered seller to create orders", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await expect(
        registry.connect(seller).createOrder(buyer.address, 1n, META)
      ).to.be.revertedWithCustomError(registry, "SellerNotRegistered");
    });

    it("rejects zero-address and self buyer", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await expect(
        registry.connect(seller).createOrder(ethers.ZeroAddress, 1n, META)
      ).to.be.revertedWithCustomError(registry, "InvalidBuyer");
      await expect(
        registry.connect(seller).createOrder(seller.address, 1n, META)
      ).to.be.revertedWithCustomError(registry, "InvalidBuyer");
      buyer; // referenced for clarity
    });

    it("runs the happy path: review completes the sale", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await registry.connect(seller).createOrder(buyer.address, 1000n, META);

      await expect(registry.connect(buyer).leaveReview(0, 5, REVIEW))
        .to.emit(registry, "OrderCompleted")
        .withArgs(0n)
        .and.to.emit(registry, "ReviewLeft")
        .withArgs(0n, seller.address, buyer.address, 5, REVIEW);

      const o = await registry.getOrder(0);
      expect(o.status).to.equal(3); // Completed
      expect(o.reviewed).to.equal(true);
      const s = await registry.getSeller(seller.address);
      expect(s.completedSales).to.equal(1n);
      expect(s.reviewsCount).to.equal(1n);
    });

    it("still supports the legacy fulfill + confirm path before review", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await registry.connect(seller).createOrder(buyer.address, 1000n, META);
      await registry.connect(buyer).acceptOrder(0);
      await registry.connect(seller).markFulfilled(0);
      await registry.connect(buyer).confirmReceived(0);

      const o = await registry.getOrder(0);
      expect(o.status).to.equal(3);
      const s = await registry.getSeller(seller.address);
      expect(s.completedSales).to.equal(1n);
    });

    it("enforces role and status guards", async () => {
      const { registry, seller, buyer, other } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await registry.connect(seller).createOrder(buyer.address, 1000n, META);

      await expect(registry.connect(other).acceptOrder(0)).to.be.revertedWithCustomError(
        registry,
        "NotOrderBuyer"
      );
      await expect(registry.connect(seller).markFulfilled(0)).to.be.revertedWithCustomError(
        registry,
        "InvalidOrderStatus"
      );

      await registry.connect(buyer).acceptOrder(0);

      await expect(registry.connect(other).markFulfilled(0)).to.be.revertedWithCustomError(
        registry,
        "NotOrderSeller"
      );
      await expect(registry.connect(buyer).acceptOrder(0)).to.be.revertedWithCustomError(
        registry,
        "InvalidOrderStatus"
      );
    });

    it("reverts for an unknown order id", async () => {
      const { registry, buyer } = await loadFixture(deployFixture);
      await expect(registry.connect(buyer).acceptOrder(42)).to.be.revertedWithCustomError(
        registry,
        "OrderNotFound"
      );
      await expect(registry.getOrder(42)).to.be.revertedWithCustomError(registry, "OrderNotFound");
    });

    it("lets the seller cancel before completion", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await registry.connect(seller).createOrder(buyer.address, 1000n, META);
      await expect(registry.connect(seller).cancelOrder(0))
        .to.emit(registry, "OrderCancelled")
        .withArgs(0n);
      const o = await registry.getOrder(0);
      expect(o.status).to.equal(4); // Cancelled
    });

    it("blocks cancel after completion", async () => {
      const { registry, seller } = await loadFixture(completedOrderFixture);
      await expect(registry.connect(seller).cancelOrder(0)).to.be.revertedWithCustomError(
        registry,
        "InvalidOrderStatus"
      );
    });
  });

  describe("reviews", () => {
    it("lets the buyer leave one review and complete the sale from Created", async () => {
      const { registry, seller, buyer } = await loadFixture(openOrderFixture);
      await expect(registry.connect(buyer).leaveReview(0, 5, REVIEW))
        .to.emit(registry, "ReviewLeft")
        .withArgs(0n, seller.address, buyer.address, 5, REVIEW);

      const s = await registry.getSeller(seller.address);
      expect(s.reviewsCount).to.equal(1n);
      expect(s.ratingSum).to.equal(5n);
      expect(s.completedSales).to.equal(1n);
    });

    it("lets the buyer review a legacy confirmed order", async () => {
      const { registry, seller, buyer } = await loadFixture(legacyConfirmedOrderFixture);
      await expect(registry.connect(buyer).leaveReview(0, 5, REVIEW))
        .to.emit(registry, "ReviewLeft")
        .withArgs(0n, seller.address, buyer.address, 5, REVIEW);

      const s = await registry.getSeller(seller.address);
      expect(s.reviewsCount).to.equal(1n);
      expect(s.completedSales).to.equal(1n);
    });

    it("prevents a random (non-buyer) review", async () => {
      const { registry, other } = await loadFixture(openOrderFixture);
      await expect(registry.connect(other).leaveReview(0, 5, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "NotOrderBuyer"
      );
    });

    it("prevents a duplicate review", async () => {
      const { registry, buyer } = await loadFixture(openOrderFixture);
      await registry.connect(buyer).leaveReview(0, 5, REVIEW);
      await expect(registry.connect(buyer).leaveReview(0, 4, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "AlreadyReviewed"
      );
    });

    it("rejects reviews after the order was already reviewed", async () => {
      const { registry, buyer } = await loadFixture(completedOrderFixture);
      await expect(registry.connect(buyer).leaveReview(0, 4, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "AlreadyReviewed"
      );
    });

    it("rejects reviews on cancelled orders", async () => {
      const { registry, seller, buyer } = await loadFixture(openOrderFixture);
      await registry.connect(seller).cancelOrder(0);
      await expect(registry.connect(buyer).leaveReview(0, 5, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "InvalidOrderStatus"
      );
    });

    it("validates the rating range (1..5)", async () => {
      const { registry, buyer } = await loadFixture(openOrderFixture);
      await expect(registry.connect(buyer).leaveReview(0, 0, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "InvalidRating"
      );
      await expect(registry.connect(buyer).leaveReview(0, 6, REVIEW)).to.be.revertedWithCustomError(
        registry,
        "InvalidRating"
      );
    });
  });

  describe("reputation and trust score", () => {
    it("returns 0 trust score for an unknown seller", async () => {
      const { registry, other } = await loadFixture(deployFixture);
      expect(await registry.getTrustScore(other.address)).to.equal(0n);
    });

    it("updates average rating and trust score after completed + reviewed sales", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");

      for (let i = 0; i < 2; i++) {
        await registry.connect(seller).createOrder(buyer.address, 1000n, META);
        await registry.connect(buyer).leaveReview(i, i === 0 ? 5 : 4, REVIEW);
      }

      const s = await registry.getSeller(seller.address);
      expect(s.completedSales).to.equal(2n);
      expect(s.reviewsCount).to.equal(2n);
      expect(s.ratingSum).to.equal(9n);

      expect(await registry.getAverageRating(seller.address)).to.equal(4n); // floor(9/2)
      // score = completedSales*10 + avg*10 = 20 + 40 = 60
      expect(await registry.getTrustScore(seller.address)).to.equal(60n);
    });

    it("caps the trust score at 100", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      for (let i = 0; i < 11; i++) {
        await registry.connect(seller).createOrder(buyer.address, 1n, META);
        await registry.connect(buyer).leaveReview(i, 5, REVIEW);
      }
      expect(await registry.getTrustScore(seller.address)).to.equal(100n);
    });

    it("tracks seller order ids", async () => {
      const { registry, seller, buyer } = await loadFixture(deployFixture);
      await registry.connect(seller).registerSeller("ana", "ipfs://demo");
      await registry.connect(seller).createOrder(buyer.address, 1n, META);
      await registry.connect(seller).createOrder(buyer.address, 2n, META);
      const ids = await registry.getSellerOrderIds(seller.address);
      expect(ids.map((x) => Number(x))).to.deep.equal([0, 1]);
    });
  });

  // -------------------------------------------------------------------------
  // EIP-712 sponsored meta-transactions (OrbiTrust pays gas, actor signs).
  // The `relayer` signer below stands in for the OrbiTrust relayer wallet:
  // it submits every transaction and pays gas, but on-chain attribution must
  // always resolve to the real seller / buyer recovered from the signature.
  // -------------------------------------------------------------------------
  describe("EIP-712 sponsored meta-transactions", () => {
    async function relayerFixture() {
      const [seller, buyer, other, relayer] = await ethers.getSigners();
      const Factory = await ethers.getContractFactory("OrbiTrustRegistry");
      const registry = await Factory.deploy();
      await registry.waitForDeployment();
      return { registry, seller, buyer, other, relayer };
    }

    it("registers a seller via a relayer-submitted signature", async () => {
      const { registry, seller, relayer } = await loadFixture(relayerFixture);
      const nonce = await registry.nonces(seller.address);
      const signature = await signAction(seller, registry, "RegisterSeller", {
        handle: "ana",
        metadataURI: "ipfs://demo",
        nonce,
      });

      await expect(
        registry
          .connect(relayer)
          .registerSellerWithSignature("ana", "ipfs://demo", nonce, signature)
      )
        .to.emit(registry, "SellerRegistered")
        .withArgs(seller.address, "ana", "ipfs://demo");

      const s = await registry.getSeller(seller.address);
      expect(s.exists).to.equal(true);
      expect(s.owner).to.equal(seller.address);
      expect(await registry.nonces(seller.address)).to.equal(1n);
    });

    it("rejects a wrong nonce and prevents signature replay", async () => {
      const { registry, seller, relayer } = await loadFixture(relayerFixture);

      const badNonce = 7n;
      const badSig = await signAction(seller, registry, "RegisterSeller", {
        handle: "ana",
        metadataURI: "ipfs://demo",
        nonce: badNonce,
      });
      await expect(
        registry
          .connect(relayer)
          .registerSellerWithSignature("ana", "ipfs://demo", badNonce, badSig)
      ).to.be.revertedWithCustomError(registry, "InvalidNonce");

      const nonce = await registry.nonces(seller.address);
      const sig = await signAction(seller, registry, "RegisterSeller", {
        handle: "ana",
        metadataURI: "ipfs://demo",
        nonce,
      });
      await registry
        .connect(relayer)
        .registerSellerWithSignature("ana", "ipfs://demo", nonce, sig);

      // Replaying the exact same signature must now fail on the consumed nonce.
      await expect(
        registry
          .connect(relayer)
          .registerSellerWithSignature("ana", "ipfs://demo", nonce, sig)
      ).to.be.revertedWithCustomError(registry, "InvalidNonce");
    });

    it("runs the full lifecycle sponsored, attributing events to real actors", async () => {
      const { registry, seller, buyer, relayer } = await loadFixture(relayerFixture);

      // Register (seller signs, relayer pays).
      let n = await registry.nonces(seller.address);
      await registry
        .connect(relayer)
        .registerSellerWithSignature(
          "ana",
          "ipfs://demo",
          n,
          await signAction(seller, registry, "RegisterSeller", {
            handle: "ana",
            metadataURI: "ipfs://demo",
            nonce: n,
          })
        );

      // Create order (seller signs over the buyer address).
      n = await registry.nonces(seller.address);
      await expect(
        registry
          .connect(relayer)
          .createOrderWithSignature(
            buyer.address,
            1000n,
            META,
            n,
            await signAction(seller, registry, "CreateOrder", {
              buyer: buyer.address,
              amount: 1000n,
              metadataHash: META,
              nonce: n,
            })
          )
      )
        .to.emit(registry, "OrderCreated")
        .withArgs(0n, seller.address, buyer.address, 1000n, META);

      // Review completes the sale (buyer signs).
      n = await registry.nonces(buyer.address);
      await expect(
        registry
          .connect(relayer)
          .leaveReviewWithSignature(
            0,
            5,
            REVIEW,
            n,
            await signAction(buyer, registry, "LeaveReview", {
              orderId: 0,
              rating: 5,
              reviewHash: REVIEW,
              nonce: n,
            })
          )
      )
        .to.emit(registry, "OrderCompleted")
        .withArgs(0n)
        .and.to.emit(registry, "ReviewLeft")
        .withArgs(0n, seller.address, buyer.address, 5, REVIEW);

      const s = await registry.getSeller(seller.address);
      expect(s.completedSales).to.equal(1n);
      expect(s.reviewsCount).to.equal(1n);
      // completedSales*10 (10) + averageRating*10 (5 -> 50) = 60
      expect(await registry.getTrustScore(seller.address)).to.equal(60n);
    });

    it("requires a registered seller for a sponsored createOrder", async () => {
      const { registry, seller, buyer, relayer } = await loadFixture(relayerFixture);
      const n = await registry.nonces(seller.address);
      const sig = await signAction(seller, registry, "CreateOrder", {
        buyer: buyer.address,
        amount: 1n,
        metadataHash: META,
        nonce: n,
      });
      await expect(
        registry.connect(relayer).createOrderWithSignature(buyer.address, 1n, META, n, sig)
      ).to.be.revertedWithCustomError(registry, "SellerNotRegistered");
    });

    it("attributes a sponsored accept to the signer, not the relayer", async () => {
      const { registry, seller, buyer, other, relayer } = await loadFixture(relayerFixture);
      let n = await registry.nonces(seller.address);
      await registry
        .connect(relayer)
        .registerSellerWithSignature(
          "ana",
          "ipfs://demo",
          n,
          await signAction(seller, registry, "RegisterSeller", {
            handle: "ana",
            metadataURI: "ipfs://demo",
            nonce: n,
          })
        );
      n = await registry.nonces(seller.address);
      await registry
        .connect(relayer)
        .createOrderWithSignature(
          buyer.address,
          1000n,
          META,
          n,
          await signAction(seller, registry, "CreateOrder", {
            buyer: buyer.address,
            amount: 1000n,
            metadataHash: META,
            nonce: n,
          })
        );

      // `other` (not the order buyer) signs the accept -> NotOrderBuyer.
      const wrongNonce = await registry.nonces(other.address);
      const wrongSig = await signAction(other, registry, "AcceptOrder", {
        orderId: 0,
        nonce: wrongNonce,
      });
      await expect(
        registry.connect(relayer).acceptOrderWithSignature(0, wrongNonce, wrongSig)
      ).to.be.revertedWithCustomError(registry, "NotOrderBuyer");
    });

    it("lets the seller cancel via a sponsored signature", async () => {
      const { registry, seller, buyer, relayer } = await loadFixture(relayerFixture);
      let n = await registry.nonces(seller.address);
      await registry
        .connect(relayer)
        .registerSellerWithSignature(
          "ana",
          "ipfs://demo",
          n,
          await signAction(seller, registry, "RegisterSeller", {
            handle: "ana",
            metadataURI: "ipfs://demo",
            nonce: n,
          })
        );
      n = await registry.nonces(seller.address);
      await registry
        .connect(relayer)
        .createOrderWithSignature(
          buyer.address,
          1000n,
          META,
          n,
          await signAction(seller, registry, "CreateOrder", {
            buyer: buyer.address,
            amount: 1000n,
            metadataHash: META,
            nonce: n,
          })
        );

      n = await registry.nonces(seller.address);
      await expect(
        registry
          .connect(relayer)
          .cancelOrderWithSignature(
            0,
            n,
            await signAction(seller, registry, "CancelOrder", { orderId: 0, nonce: n })
          )
      )
        .to.emit(registry, "OrderCancelled")
        .withArgs(0n);
      const o = await registry.getOrder(0);
      expect(o.status).to.equal(4); // Cancelled
    });

    it("exposes a non-zero EIP-712 domain separator", async () => {
      const { registry } = await loadFixture(relayerFixture);
      const sep = await registry.domainSeparator();
      expect(sep).to.not.equal(ethers.ZeroHash);
    });
  });
});
