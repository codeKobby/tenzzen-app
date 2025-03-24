"use client"

import { Button } from "@/components/ui/button"
import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { initDefaultEnrollmentsIfEmpty } from "@/lib/local-storage"

export function DebugButton() {
  const [isDebugging, setIsDebugging] = useState(false);
  const { userId } = useAuth();

  // Show localStorage data in formatted view
  const showStorageData = () => {
    setIsDebugging(true);
    try {
      // Try to read all localStorage data
      const data: Record<string, any> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            data[key] = JSON.parse(localStorage.getItem(key) || 'null');
          } catch (e) {
            data[key] = localStorage.getItem(key);
          }
        }
      }

      console.log("=== LocalStorage Debug Info ===");
      console.table(data);

      // Check for enrollments specifically
      if (data.enrollments) {
        console.log("=== Enrollments Detail ===");
        console.log(data.enrollments);
      }

      // Initialize default data if missing
      if (userId && (!data.enrollments || data.enrollments.length === 0)) {
        console.log("No enrollments found, initializing default data");
        initDefaultEnrollmentsIfEmpty(userId);
      }

    } catch (e) {
      console.error("Debug error:", e);
    } finally {
      setIsDebugging(false);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={showStorageData}
      disabled={isDebugging}
      className="absolute bottom-2 right-2 opacity-60 hover:opacity-100"
    >
      {isDebugging ? "Debugging..." : "Debug Data"}
    </Button>
  );
}
