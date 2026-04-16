import { Session } from "@polokaz/auth";
import { db, user, eq } from "@polokaz/db";
import { ForbiddenError } from "@polokaz/errors";

export class UsersService {
  session: Session;

  constructor(options: { session: Session }) {
    this.session = options.session;
  }

  async getAll() {
    if (!this.session) throw new ForbiddenError();
    if (this.session.user.role !== "admin") throw new ForbiddenError();

    const users = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        referralId: user.referralId,
        birthdate: user.birthdate,
        countryName: user.countryName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user);

    return users;
  }

  async getOne(id: string) {
    if (!this.session) throw new ForbiddenError();

    const [found] = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        image: user.image,
        role: user.role,
        banned: user.banned,
        banReason: user.banReason,
        banExpires: user.banExpires,
        referralId: user.referralId,
        birthdate: user.birthdate,
        countryName: user.countryName,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      })
      .from(user)
      .where(eq(user.id, id));

    return found ?? null;
  }
}
