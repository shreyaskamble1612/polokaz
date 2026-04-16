import { account, db, user } from "@polokaz/db";
import bcrypt from "bcryptjs";
import { hashPassword } from "better-auth/crypto";
import "dotenv/config";

async function main() {
  console.log("Seeding initial admin user to database");

  const existing = await db.query.user.findFirst();

  if (existing) {
    console.log("User already exists, skipping seed.");
    return;
  }

  let [createdUser] = await db
    .insert(user)
    .values({
      id: crypto.randomUUID(),
      birthdate: new Date(),
      countryName: "United states",
      email: "polokaz@polokaz.com",
      emailVerified: true,
      name: "Mr Polokaz",
      role: "admin",
    })
    .returning();

  let password = await hashPassword("polokaz");

  try {
    await db.insert(account).values({
      id: crypto.randomUUID(),
      accountId: createdUser.id,
      providerId: "credential",
      password,
      userId: createdUser.id,
    });
  } catch (e) {
    console.error(`🔴 There was an error seeding initial user: ${e}`);

    return;
  }

  console.log(`✅ User created correctly with ID ${createdUser.id}`);
}

async function runSeed() {
  await main();
}
runSeed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
