import express from "express";
import { UsersService } from "../services/users";

const router = express.Router();

router.get("/", async (req, res) => {
  const service = new UsersService({
    session: req.session,
  });

  const users = await service.getAll();

  return res.json({ users });
});

router.get("/:id", async (req, res) => {
  const service = new UsersService({
    session: req.session,
  });

  const user = await service.getOne(req.params.id);

  return res.json({ user });
});

export { router as usersRouter };
