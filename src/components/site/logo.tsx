"use client";

import Image from "next/image";
import { useRoute } from "@/lib/router";

export function Logo() {
  const { navigate } = useRoute();
  return (
    <button
      onClick={() => navigate("/")}
      className="flex items-center gap-2.5 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
      aria-label="Madni Advertiser — go to home"
    >
      <Image
        src="/images/logo.png"
        alt="Madni Advertiser logo"
        width={56}
        height={56}
        priority
        className="h-12 w-12 object-contain lg:h-14 lg:w-14"
      />
    </button>
  );
}
