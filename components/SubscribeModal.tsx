"use client";

import { useEffect } from "react";
import SubscribeForm from "@/components/SubscribeForm";

interface Props {
  topics: string[];
  onClose: () => void;
}

export default function SubscribeModal({ topics, onClose }: Props) {
  // Close on Escape key
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        // Click on backdrop closes modal
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-150">
        <SubscribeForm topics={topics} onClose={onClose} />
      </div>
    </div>
  );
}
