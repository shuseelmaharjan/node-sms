export default function ForbiddenPage() {
  return (
    <div className="min-h-screen grid place-items-center px-6">
      <div className="max-w-md text-center space-y-2">
        <h1 className="text-2xl font-semibold">Access denied</h1>
        <p className="text-sm text-muted-foreground">
          You don’t have permission to access this page.
        </p>
      </div>
    </div>
  );
}
