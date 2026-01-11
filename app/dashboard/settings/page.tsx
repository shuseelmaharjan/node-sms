export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">
          Configure system preferences and manage your organization settings.
        </p>
      </div>

      <div className="text-sm text-muted-foreground">
        Select a settings category from the sidebar to configure specific options.
      </div>
    </div>
  );
}