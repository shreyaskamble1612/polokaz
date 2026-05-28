import express from "express";
import {
  listWalletItems,
  removeDealFromWallet,
  saveDealToWallet,
  redeemDealInWallet,
} from "../controllers/wallet.controller";

const router = express.Router();

router.get("/", listWalletItems);
router.post("/save", saveDealToWallet);
router.delete("/:dealId", removeDealFromWallet);
router.post("/:dealId/redeem", redeemDealInWallet);

export { router as walletRouter };
