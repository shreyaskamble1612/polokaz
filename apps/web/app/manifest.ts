import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Polokaz - Local Coupon Directory",
    short_name: "Polokaz",
    description: "Discover exclusive coupons, vouchers, and loyalty stamps from local merchants near you.",
    start_url: "/customer",
    display: "standalone",
    background_color: "#09090f",
    theme_color: "#0f7af7",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
