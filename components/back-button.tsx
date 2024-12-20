"use client";

import { useRouter } from "next/navigation";

const BackButton = () => {
  const router = useRouter();

  return (
    <button
      onClick={() => router.back()}
      className="text-red-500 hover:underline"
    >
      &larr; Tagasi
    </button>
  );
};

export default BackButton;
