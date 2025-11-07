// 'use client';

// import { Button } from '@/components/ui/button';
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from '@/components/ui/card';
// import { Input } from '@/components/ui/input';
// import { Label } from '@/components/ui/label';
// import { useRouter } from 'next/navigation';
// import { useState } from 'react';
// import Link from 'next/link';

// export default function SignUpForm() {
//   const router = useRouter();
//   const [clientId, setClientId] = useState('');
//   const [clientName, setClientName] = useState('');
//   const [error, setError] = useState('');
//   const [successMessage, setSuccessMessage] = useState('');
//   const [newApiKey, setNewApiKey] = useState('');

//   const handleSignUp = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setError('');
//     setSuccessMessage('');
//     setNewApiKey('');

//     try {
//       const response = await fetch('/api/signup', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           clientId,
//           clientName,
//         }),
//       });

//       const data = await response.json();

//       if (response.ok) {
//         setSuccessMessage(data.message);
//         setNewApiKey(data.apiKey);
//       } else {
//         setError(data.message || 'An error occurred during sign-up.');
//       }
//     } catch (err) {
//       setError('An unexpected error occurred.');
//     }
//   };

//   return (
//     <div className="flex items-center justify-center min-h-screen">
//       <Card className="min-w-lg">
//         <CardHeader>
//           <CardTitle className="text-2xl">Sign Up</CardTitle>
//           <CardDescription>
//             Create a new account to get an API Key. Already have an account?{' '}
//             <Link href="/login" className="text-primary hover:underline">
//               Login
//             </Link>
//           </CardDescription>
//         </CardHeader>
//         <CardContent>
//           {!successMessage ? (
//             <form onSubmit={handleSignUp} className="grid gap-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="clientId">Client ID (Username)</Label>
//                 <Input
//                   id="clientId"
//                   type="text"
//                   placeholder="e.g., my-awesome-project"
//                   required
//                   value={clientId}
//                   onChange={(e) => setClientId(e.target.value)}
//                 />
//               </div>
//               <div className="grid gap-2">
//                 <Label htmlFor="clientName">Client Name</Label>
//                 <Input
//                   id="clientName"
//                   type="text"
//                   placeholder="e.g., My Awesome Project"
//                   required
//                   value={clientName}
//                   onChange={(e) => setClientName(e.target.value)}
//                 />
//               </div>
//               {error && <p className="text-red-500 text-sm">{error}</p>}
//               <Button type="submit" className="w-full">
//                 Sign Up
//               </Button>
//             </form>
//           ) : (
//             <div className="space-y-4 text-center">
//               <p className="text-green-600">{successMessage}</p>
//               <div className="p-4 bg-muted rounded-md">
//                 <Label>Your New Client Key (Password)</Label>
//                 <p className="font-mono text-sm break-all p-2 bg-background rounded">{newApiKey}</p>
//                 <p className="text-xs text-muted-foreground mt-2">Store this securely. You will not be able to see it again.</p>
//               </div>
//               <Button asChild className="w-full">
//                 <Link href="/login">
//                   Proceed to Login
//                 </Link>
//               </Button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

import React from 'react'

const page = () => {
  return (
    <div>Page Not Found</div>
  )
}

export default page