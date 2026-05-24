import express from "express";
import {
  listWalletItems,
  removeDealFromWallet,
  saveDealToWallet,
} from "../controllers/wallet.controller";

const router = express.Router();

router.get("/", listWalletItems);
router.post("/save", saveDealToWallet);
router.delete("/:dealId", removeDealFromWallet);

export { router as walletRouter };
