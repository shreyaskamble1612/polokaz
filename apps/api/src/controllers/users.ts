import express from "express";
import { UsersService } from "../services/users";
import { requireRole } from "../lib/authorization";

const router = express.Router();

router.get("/", async (req, res) => {
  const session = requireRole(req, res, ["admin"]);

  if (!session) {
    return;
  }

  const service = new UsersService({
    session,
  });

  const users = await service.getAll();

  return res.json({ users });
});

router.get("/:id", async (req, res) => {
  const session = requireRole(req, res, ["admin"]);

  if (!session) {
    return;
  }

  const service = new UsersService({
    session,
  });

  const user = await service.getOne(req.params.id);

  return res.json({ user });
});

export { router as usersRouter };
