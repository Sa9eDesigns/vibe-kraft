"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProfileSettings } from "@/components/dashboard/settings/profile-settings";
import { AppearanceSettings } from "@/components/dashboard/settings/appearance-settings";
import { NotificationSettings } from "@/components/dashboard/settings/notification-settings";
import { SecuritySettings } from "@/components/dashboard/settings/security-settings";

export function SettingsTabs() {
  const [activeTab, setActiveTab] = useState("profile");

  return (
    <Tabs defaultValue="profile" value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="profile">Profile</TabsTrigger>
        <TabsTrigger value="appearance">Appearance</TabsTrigger>
        <TabsTrigger value="notifications">Notifications</TabsTrigger>
        <TabsTrigger value="security">Security</TabsTrigger>
      </TabsList>
      <TabsContent value="profile" className="mt-6">
        <ProfileSettings />
      </TabsContent>
      <TabsContent value="appearance" className="mt-6">
        <AppearanceSettings />
      </TabsContent>
      <TabsContent value="notifications" className="mt-6">
        <NotificationSettings />
      </TabsContent>
      <TabsContent value="security" className="mt-6">
        <SecuritySettings />
      </TabsContent>
    </Tabs>
  );
}