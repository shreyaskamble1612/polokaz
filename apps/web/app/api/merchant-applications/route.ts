import { randomUUID } from "crypto";

import { db } from "@polokaz/db";
import { merchantApplication } from "@polokaz/db/schema";
import { getServerSession } from "@/lib/auth/server-session";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const session = await getServerSession();

  if (!session?.session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    companyName?: string;
    companyEmail?: string;
    companyPhone?: string;
    companyAddress?: string;
    companyWebsite?: string;
    businessType?: string;
    contactPersonOneName?: string;
    contactPersonOnePhone?: string;
    contactPersonTwoName?: string;
    contactPersonTwoPhone?: string;
    memberRange?: string;
    notes?: string;
  };

  const requiredFields = [
    body.companyName,
    body.companyEmail,
    body.companyPhone,
    body.companyAddress,
    body.businessType,
    body.contactPersonOneName,
    body.contactPersonOnePhone,
    body.memberRange,
  ];

  if (requiredFields.some((value) => !value || !value.trim())) {
    return NextResponse.json(
      { message: "Missing required merchant application fields" },
      { status: 422 },
    );
  }

  const companyName = body.companyName!.trim();
  const companyEmail = body.companyEmail!.trim();
  const companyPhone = body.companyPhone!.trim();
  const companyAddress = body.companyAddress!.trim();
  const companyWebsite = body.companyWebsite?.trim() || null;
  const businessType = body.businessType!.trim();
  const contactPersonOneName = body.contactPersonOneName!.trim();
  const contactPersonOnePhone = body.contactPersonOnePhone!.trim();
  const contactPersonTwoName = body.contactPersonTwoName?.trim() || null;
  const contactPersonTwoPhone = body.contactPersonTwoPhone?.trim() || null;
  const memberRange = body.memberRange!.trim();
  const notes = body.notes?.trim() || null;

  await db
    .insert(merchantApplication)
    .values({
      id: randomUUID(),
      userId: session.user.id,
      companyName,
      companyEmail,
      companyPhone,
      companyAddress,
      companyWebsite,
      businessType,
      contactPersonOneName,
      contactPersonOnePhone,
      contactPersonTwoName,
      contactPersonTwoPhone,
      memberRange,
      notes,
      status: "pending",
    })
    .onConflictDoUpdate({
      target: merchantApplication.userId,
      set: {
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyWebsite,
        businessType,
        contactPersonOneName,
        contactPersonOnePhone,
        contactPersonTwoName,
        contactPersonTwoPhone,
        memberRange,
        notes,
        status: "pending",
        updatedAt: new Date(),
      },
    });

  return NextResponse.json({ ok: true });
}