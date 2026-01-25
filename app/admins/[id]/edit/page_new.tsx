"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface Props {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ tab?: string }>;
}

export default function AdminEditRedirect({ params, searchParams }: Props) {
  const router = useRouter();

  useEffect(() => {
    const redirect = async () => {
      const { id } = await params;
      const search = await searchParams;
      const tab = search?.tab || "personal";
      
      // Redirect to the create page with the userId parameter
      router.replace(`/admins/create?tab=${tab}&userId=${id}`);
    };
    
    redirect();
  }, [params, searchParams, router]);

  return (
    <div className="container mx-auto py-6 flex items-center justify-center">
      <div className="text-center space-y-2">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p>Redirecting to edit form...</p>
      </div>
    </div>
  );
}