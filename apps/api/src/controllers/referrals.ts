import express from "express";
import { ReferralsService } from "../services/referrals";

const router = express.Router();

router.get("/", async (req, res) => {
  const service = new ReferralsService({
    session: req.session,
  });

  const referrals = await service.getAll();

  return res.json({ referrals });
});

router.post("/", async (req, res) => {
  const service = new ReferralsService({
    session: req.session,
  });

  const [referral] = await service.createOne(req.body);

  return res.json({ referral });
});

export { router as referralRouter };

