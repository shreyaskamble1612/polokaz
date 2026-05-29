import "dotenv/config";
import { db, user, account, merchants, merchantApplication, deals, eq } from "@polokaz/db";
import { hashPassword } from "better-auth/crypto";

// Use realistic Unsplash photos that fit food/wellness/beauty/retail/education
const IMAGES = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=80",
  burger_combo: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=800&q=80",
  clothing: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=800&q=80",
  clothing2: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=800&q=80",
  spa: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80",
  massage: "https://images.unsplash.com/photo-1519699047748-de8e457a634e?auto=format&fit=crop&w=800&q=80",
  beauty: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  education: "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80",
  education2: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=800&q=80"
};

const MERCHANT_DATA = [
  {
    email: "burger@polokaz.com",
    name: "John Burger",
    businessName: "Burger Republic Co.",
    businessCategory: "food",
    website: "https://burgerrepublic.com",
    companyAddress: "Las Vegas, Nevada",
    companyPhone: "(123) 456-7890",
    deals: [
      {
        coupontoolsId: "deal_burger_1",
        title: "25% Off Overall Bill",
        description: "Enjoy a flat 25% discount on all food and beverage orders at select locations. No minimum bill required.",
        category: "food",
        dealType: "coupon" as const,
        discountValue: "25",
        discount: "25%",
        imageUrl: IMAGES.burger,
        thumbnailUrl: IMAGES.burger,
        featured: true,
      },
      {
        coupontoolsId: "deal_burger_2",
        title: "Burger Combo BOGO",
        description: "Buy any premium burger combo and get the second one completely free. Valid for dine-in only.",
        category: "food",
        dealType: "coupon" as const,
        discountValue: "0",
        discount: "BOGO",
        imageUrl: IMAGES.burger_combo,
        thumbnailUrl: IMAGES.burger_combo,
        featured: false,
      }
    ]
  },
  {
    email: "urban@polokaz.com",
    name: "Sarah Thread",
    businessName: "Urban Thread Co.",
    businessCategory: "retail",
    website: "https://urbanthread.com",
    companyAddress: "New York, USA",
    companyPhone: "(234) 567-8901",
    deals: [
      {
        coupontoolsId: "deal_urban_1",
        title: "$300 Off Overall Bill",
        description: "Special seasonal discount: Get $300 off your boutique luxury wardrobe renovation. Valid on orders over $1000.",
        category: "retail",
        dealType: "coupon" as const,
        discountValue: "300",
        discount: "$300",
        imageUrl: IMAGES.clothing,
        thumbnailUrl: IMAGES.clothing,
        featured: true,
      },
      {
        coupontoolsId: "deal_urban_2",
        title: "15% Off Summer Collection",
        description: "Refresh your summer style with 15% off all newly arrived linen wear, sunglasses, and beach accessories.",
        category: "retail",
        dealType: "voucher" as const,
        discountValue: "15",
        discount: "15%",
        imageUrl: IMAGES.clothing2,
        thumbnailUrl: IMAGES.clothing2,
        featured: false,
      }
    ]
  },
  {
    email: "glowup@polokaz.com",
    name: "Mia Glow",
    businessName: "Glowup Studio",
    businessCategory: "beauty",
    website: "https://glowupstudio.com",
    companyAddress: "Miami, Florida",
    companyPhone: "(345) 678-9012",
    deals: [
      {
        coupontoolsId: "deal_glow_1",
        title: "30% Off Premium Hair Styling",
        description: "Transform your look with our senior stylists. Get 30% off haircuts, color, and keratin treatments.",
        category: "beauty",
        dealType: "coupon" as const,
        discountValue: "30",
        discount: "30%",
        imageUrl: IMAGES.beauty,
        thumbnailUrl: IMAGES.beauty,
        featured: true,
      },
      {
        coupontoolsId: "deal_glow_2",
        title: "Free Skin Care Pack",
        description: "Book any facial treatment session and receive a complimentary premium organic skincare take-home pack.",
        category: "beauty",
        dealType: "coupon" as const,
        discountValue: "0",
        discount: "Free Pack",
        imageUrl: IMAGES.spa,
        thumbnailUrl: IMAGES.spa,
        featured: false,
      }
    ]
  },
  {
    email: "wellness@polokaz.com",
    name: "Alex Well",
    businessName: "Zenith Wellness Co.",
    businessCategory: "health",
    website: "https://zenithwellness.com",
    companyAddress: "Los Angeles, California",
    companyPhone: "(456) 789-0123",
    deals: [
      {
        coupontoolsId: "deal_well_1",
        title: "15% Off Stress Management Session",
        description: "Re-center your mind and body. Get a 15% discount on stress management counseling and mindfulness sessions.",
        category: "health",
        dealType: "coupon" as const,
        discountValue: "15",
        discount: "15%",
        imageUrl: IMAGES.massage,
        thumbnailUrl: IMAGES.massage,
        featured: true,
      }
    ]
  },
  {
    email: "edu@polokaz.com",
    name: "David Learn",
    businessName: "Alpha Education Group",
    businessCategory: "education",
    website: "https://alphaedu.com",
    companyAddress: "Chicago, Illinois",
    companyPhone: "(567) 890-1234",
    deals: [
      {
        coupontoolsId: "deal_edu_1",
        title: "Free Intro Python Coding Course",
        description: "Unlock your software engineering potential. Join our top-rated Python bootcamp class for the first week free.",
        category: "education",
        dealType: "coupon" as const,
        discountValue: "0",
        discount: "Free Week",
        imageUrl: IMAGES.education,
        thumbnailUrl: IMAGES.education,
        featured: true,
      },
      {
        coupontoolsId: "deal_edu_2",
        title: "20% Off SAT/ACT Preparation",
        description: "Score higher in college admissions. Enroll in any exam preparation class and save 20% on tuition and material fees.",
        category: "education",
        dealType: "voucher" as const,
        discountValue: "20",
        discount: "20%",
        imageUrl: IMAGES.education2,
        thumbnailUrl: IMAGES.education2,
        featured: false,
      }
    ]
  }
];

async function main() {
  console.log("Starting database seed with real merchant and deal data...");

  const defaultPassword = await hashPassword("polokaz");

  for (const item of MERCHANT_DATA) {
    console.log(`Processing merchant: ${item.businessName}`);

    // Check if user already exists
    let [existingUser] = await db
      .select()
      .from(user)
      .where(eq(user.email, item.email))
      .limit(1);

    if (!existingUser) {
      console.log(`  Creating user: ${item.email}`);
      [existingUser] = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name: item.name,
          email: item.email,
          emailVerified: true,
          birthdate: new Date("1995-05-15"),
          countryName: "United States",
          role: "merchant",
          tier: "merchant",
        })
        .returning();

      // Create credential account
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: existingUser.id,
        providerId: "credential",
        password: defaultPassword,
        userId: existingUser.id,
      });
    }

    // Check if merchant profile exists
    let [merchantProfile] = await db
      .select()
      .from(merchants)
      .where(eq(merchants.userId, existingUser.id))
      .limit(1);

    if (!merchantProfile) {
      console.log(`  Creating merchant profile for: ${item.businessName}`);
      [merchantProfile] = await db
        .insert(merchants)
        .values({
          id: crypto.randomUUID(),
          userId: existingUser.id,
          businessName: item.businessName,
          businessCategory: item.businessCategory,
          contactEmail: item.email,
          website: item.website,
          status: "active",
        })
        .returning();
    }

    // Check if merchant application exists
    let [application] = await db
      .select()
      .from(merchantApplication)
      .where(eq(merchantApplication.userId, existingUser.id))
      .limit(1);

    if (!application) {
      console.log(`  Creating approved merchant application for: ${item.businessName}`);
      await db.insert(merchantApplication).values({
        id: crypto.randomUUID(),
        userId: existingUser.id,
        companyName: item.businessName,
        companyEmail: item.email,
        companyPhone: item.companyPhone,
        companyAddress: item.companyAddress,
        companyWebsite: item.website,
        businessType: item.businessCategory,
        contactPersonOneName: item.name,
        contactPersonOnePhone: item.companyPhone,
        memberRange: "1-10",
        status: "approved",
      });
    }

    // Process deals for this merchant
    for (const d of item.deals) {
      let [existingDeal] = await db
        .select()
        .from(deals)
        .where(eq(deals.coupontoolsId, d.coupontoolsId))
        .limit(1);

      if (!existingDeal) {
        console.log(`  Inserting deal: "${d.title}"`);
        await db.insert(deals).values({
          id: crypto.randomUUID(),
          coupontoolsId: d.coupontoolsId,
          title: d.title,
          description: d.description,
          category: d.category,
          dealType: d.dealType,
          discountValue: d.discountValue,
          discount: d.discount,
          imageUrl: d.imageUrl,
          thumbnailUrl: d.thumbnailUrl,
          merchantId: merchantProfile.id,
          merchantName: merchantProfile.businessName,
          merchantLogo: d.imageUrl, // Use deal image as logo
          merchantWebsite: merchantProfile.website,
          status: "active",
          startDate: new Date("2025-11-20"),
          endDate: new Date("2029-11-30"),
          expiresAt: new Date("2029-11-30"),
          featured: d.featured,
          syncedAt: new Date(),
        });
      } else {
        console.log(`  Deal "${d.title}" already exists, updating...`);
        await db
          .update(deals)
          .set({
            merchantId: merchantProfile.id,
            merchantName: merchantProfile.businessName,
            status: "active",
            startDate: new Date("2025-11-20"),
            endDate: new Date("2029-11-30"),
            expiresAt: new Date("2029-11-30"),
            imageUrl: d.imageUrl,
            thumbnailUrl: d.thumbnailUrl,
            merchantLogo: d.imageUrl,
            discountValue: d.discountValue,
            discount: d.discount,
          })
          .where(eq(deals.coupontoolsId, d.coupontoolsId));
      }
    }
  }

  console.log("✅ Seeding of real data completed successfully!");
}

main()
  .catch((e) => {
    console.error("🔴 Seeding failed:", e);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
