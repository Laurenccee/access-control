import SignInForm from '@/features/auth/components/SignInForm';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailSignInForm from '@/features/auth/components/EmailSignInForm';

export default function SignInPage() {
  return (
    <div className="flex flex-1 items-center justify-center w-full p-4">
      <Tabs defaultValue="email-and-password" className="max-w-md w-full">
        <TabsList className="w-full">
          <TabsTrigger value="email-and-password">
            Email and Password
          </TabsTrigger>
          <TabsTrigger value="password">Email OTP</TabsTrigger>
        </TabsList>
        <TabsContent value="email-and-password">
          <SignInForm />
        </TabsContent>
        <TabsContent value="password">
          <EmailSignInForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}
