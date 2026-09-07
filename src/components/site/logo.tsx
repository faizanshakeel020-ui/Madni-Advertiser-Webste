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
        width={96}
        height={96}
        priority
        className="h-16 w-16 object-contain sm:h-[72px] sm:w-[72px] lg:h-20 lg:w-20"
      />
    </button>
  );
}
