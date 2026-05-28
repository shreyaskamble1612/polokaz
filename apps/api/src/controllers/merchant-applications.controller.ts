import { merchantApplication } from "@polokaz/db/schema";
import { and, db, desc, eq } from "@polokaz/db";
import { Request, Response } from "express";
import { z } from "zod";
import { requireSession } from "../lib/authorization";

const merchantApplicationSchema = z.object({
  companyName: z.string().min(2),
  companyEmail: z.string().email(),
  companyPhone: z.string().min(2),
  companyAddress: z.string().min(2),
  companyWebsite: z.string().trim().optional().nullable(),
  businessType: z.string().min(1),
  contactPersonOneName: z.string().min(2),
  contactPersonOnePhone: z.string().min(2),
  contactPersonTwoName: z.string().trim().optional().nullable(),
  contactPersonTwoPhone: z.string().trim().optional().nullable(),
  memberRange: z.string().min(1),
  notes: z.string().trim().optional().nullable(),
});

function serializeMerchantApplication(row: typeof merchantApplication.$inferSelect) {
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function submitMerchantApplication(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const parsed = merchantApplicationSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: { code: "INVALID_REQUEST", message: "Invalid merchant application payload" },
    });
  }

  const [application] = await db
    .insert(merchantApplication)
    .values({
      id: crypto.randomUUID(),
      userId: session.user.id,
      companyName: parsed.data.companyName.trim(),
      companyEmail: parsed.data.companyEmail.trim(),
      companyPhone: parsed.data.companyPhone.trim(),
      companyAddress: parsed.data.companyAddress.trim(),
      companyWebsite: parsed.data.companyWebsite?.trim() || null,
      businessType: parsed.data.businessType.trim(),
      contactPersonOneName: parsed.data.contactPersonOneName.trim(),
      contactPersonOnePhone: parsed.data.contactPersonOnePhone.trim(),
      contactPersonTwoName: parsed.data.contactPersonTwoName?.trim() || null,
      contactPersonTwoPhone: parsed.data.contactPersonTwoPhone?.trim() || null,
      memberRange: parsed.data.memberRange.trim(),
      notes: parsed.data.notes?.trim() || null,
      status: "pending",
    })
    .onConflictDoUpdate({
      target: merchantApplication.userId,
      set: {
        companyName: parsed.data.companyName.trim(),
        companyEmail: parsed.data.companyEmail.trim(),
        companyPhone: parsed.data.companyPhone.trim(),
        companyAddress: parsed.data.companyAddress.trim(),
        companyWebsite: parsed.data.companyWebsite?.trim() || null,
        businessType: parsed.data.businessType.trim(),
        contactPersonOneName: parsed.data.contactPersonOneName.trim(),
        contactPersonOnePhone: parsed.data.contactPersonOnePhone.trim(),
        contactPersonTwoName: parsed.data.contactPersonTwoName?.trim() || null,
        contactPersonTwoPhone: parsed.data.contactPersonTwoPhone?.trim() || null,
        memberRange: parsed.data.memberRange.trim(),
        notes: parsed.data.notes?.trim() || null,
        status: "pending",
        updatedAt: new Date(),
      },
    })
    .returning();

  return res.status(201).json({ application: serializeMerchantApplication(application) });
}

export async function getMyMerchantApplication(req: Request, res: Response) {
  const session = requireSession(req, res);

  if (!session) return;

  const [application] = await db
    .select()
    .from(merchantApplication)
    .where(eq(merchantApplication.userId, session.user.id))
    .orderBy(desc(merchantApplication.updatedAt))
    .limit(1);

  if (!application) {
    return res.json({ application: null });
  }

  return res.json({ application: serializeMerchantApplication(application) });
}
