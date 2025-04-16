"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { toast } from "@/components/custom-toast";

/**
 * Component to verify if the Google AI API key is working
 */
export function ApiKeyTester() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const verifyApiKey = async () => {
    try {
      setIsVerifying(true);
      setIsValid(null);
      setErrorMessage(null);

      // Call our verification endpoint
      const response = await fetch('/api/course-generation/verify-key');
      const data = await response.json();

      if (data.valid) {
        setIsValid(true);
        toast.success("API Key Valid", {
          description: "Your Google AI API key is working correctly"
        });
      } else {
        setIsValid(false);
        setErrorMessage(data.details || data.error || "Unknown error");
        toast.error("API Key Invalid", {
          description: data.details || data.error || "The API key validation failed"
        });
      }
    } catch (error) {
      setIsValid(false);
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      setErrorMessage(message);
      toast.error("Verification Failed", {
        description: "Could not verify API key: " + message
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Card className="p-4 mt-4">
      <div className="flex flex-col space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Google AI API Key Test</h3>
          <Button
            onClick={verifyApiKey}
            disabled={isVerifying}
            variant="outline"
            size="sm"
          >
            {isVerifying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify API Key"
            )}
          </Button>
        </div>

        {isValid !== null && (
          <div className={`flex items-center p-3 rounded-md ${isValid
              ? "bg-green-50 border border-green-200 text-green-700"
              : "bg-red-50 border border-red-200 text-red-700"
            }`}>
            {isValid ? (
              <>
                <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                <span>API key is valid and working correctly</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 mr-2 text-red-500" />
                <div className="flex flex-col">
                  <span>API key verification failed</span>
                  {errorMessage && (
                    <span className="text-sm mt-1 text-red-600">
                      {errorMessage}
                    </span>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}