"use client";
import {
  useSignerStatus,
  useUser,
} from "@account-kit/react";
import { useRouter } from "next/navigation"; // Import Next.js router for navigation
import { useEffect } from "react";


export default function Page() {
  const user = useUser();
  const signerStatus = useSignerStatus();
  const router = useRouter(); // Initialize Next.js router


  console.log(signerStatus.status);

  // Redirect logic
  useEffect(() => {
    if (!signerStatus.isInitializing) {
      console.log("User status:", user); // Log user status
      if (user) {
        router.push("/home"); // Only redirect if user is logged in
      }
    }
  }, [signerStatus.isInitializing, user, router]);

   // New effect to redirect after logout
   useEffect(() => {
    if (!signerStatus.isInitializing && !user) {
      router.push("/"); // Redirect to landing page if user is not logged in
    }
  }, [user, signerStatus.isInitializing, router]);

  // Show landing page content if user is not logged in
  return (
    <main className="flex min-h-screen flex-col items-center p-24 gap-4 justify-center text-center">
      {signerStatus.isInitializing ? (
        <p>Loading...</p> // Show loading state while initializing
      ) : !user ? (
        // Show landing page content if user is not logged in
        <div>
          <h1>Welcome to Our App</h1>
          <p>This is the landing page content.</p>
        </div>
      ) : null}
    </main>
  );

}
