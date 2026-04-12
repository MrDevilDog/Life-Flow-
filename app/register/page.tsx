"use client";

import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { RegistrationForm } from "@/components/register/registration-form";

export default function RegisterPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 bg-background py-10 lg:py-16">
        <div className="mx-auto max-w-3xl px-4 lg:px-8">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-mono md:text-4xl">
              Register as a Donor
            </h1>
            <p className="mt-2 text-muted-foreground">
              Fill in your details below to join our community of life-savers
            </p>
          </div>

          <RegistrationForm />
        </div>
      </main>
      <Footer />
    </div>
  );
}
