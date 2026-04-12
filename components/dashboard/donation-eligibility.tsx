"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Calendar, Clock, CheckCircle, AlertCircle, RefreshCw } from "lucide-react";

interface DonationEligibilityProps {
  className?: string;
}

export function DonationEligibility({ className }: DonationEligibilityProps) {
  const [eligibility, setEligibility] = useState<{
    eligible: boolean;
    canDonate: boolean;
    lastDonationDate: string | null;
    nextEligibleDate: string | null;
    daysRemaining: number;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkEligibility();
  }, []);

  const checkEligibility = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError("Please login to check your eligibility");
        return;
      }
      
      const response = await fetch("/api/donate", {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (data.success) {
        setEligibility(data);
      } else {
        setError(data.error || "Failed to check eligibility");
      }
    } catch (error) {
      console.error("Error checking eligibility:", error);
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Checking Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Eligibility Check Failed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <div className="text-center">
            <Button onClick={checkEligibility} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!eligibility) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Unable to Check Eligibility
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">Unable to check donation eligibility. Please try again.</p>
            <Button onClick={checkEligibility} className="mt-4">
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isEligible = eligibility.eligible || eligibility.canDonate; // Support both field names

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {isEligible ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-600" />
              Eligible to Donate
            </>
          ) : (
            <>
              <Clock className="h-5 w-5 text-orange-600" />
              Donation Cooldown
            </>
          )}
        </CardTitle>
        <CardDescription>
          {isEligible 
            ? "You are eligible to donate blood" 
            : `You can donate after ${eligibility.daysRemaining} day${eligibility.daysRemaining === 1 ? '' : 's'}`
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Status:</span>
            <Badge variant={isEligible ? "default" : "secondary"}>
              {isEligible ? "Eligible" : "Not Eligible"}
            </Badge>
          </div>

          {eligibility.lastDonationDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Last Donation:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(eligibility.lastDonationDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {eligibility.nextEligibleDate && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Next Eligible Date:</span>
              <span className="text-sm text-muted-foreground">
                {new Date(eligibility.nextEligibleDate).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
          )}

          {eligibility.daysRemaining > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Days Remaining:</span>
              <span className="text-sm text-muted-foreground font-semibold">
                {eligibility.daysRemaining} day{eligibility.daysRemaining === 1 ? '' : 's'}
              </span>
            </div>
          )}

          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-center">
              {eligibility.message}
            </p>
          </div>

          {!isEligible && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800 text-center">
                <strong>90-Day Rule:</strong> For your safety and the health of recipients, 
                donors must wait at least 90 days between blood donations.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
