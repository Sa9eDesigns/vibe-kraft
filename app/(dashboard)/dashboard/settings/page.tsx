import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Settings - VibeKraft',
  description: 'Manage your account settings and preferences',
};

export default function SettingsPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences.
          </p>
        </div>

        <div className="grid gap-6">
          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Account Settings</h2>
            <p className="text-muted-foreground">
              Account settings will be available soon.
            </p>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Workspace Preferences</h2>
            <p className="text-muted-foreground">
              Workspace preferences will be available soon.
            </p>
          </div>

          <div className="rounded-lg border p-6">
            <h2 className="text-xl font-semibold mb-4">Infrastructure Settings</h2>
            <p className="text-muted-foreground">
              Infrastructure settings will be available soon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}