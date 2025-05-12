import { useAuth } from "@/hooks/use-auth";

export default function ParentTest() {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Parent Test Page</h1>
      <p className="text-lg">If you can see this, the parent routing is working!</p>

      <div className="mt-6 p-4 border rounded-md bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Auth State:</h2>
        {user ? (
          <div>
            <p><strong>Username:</strong> {user.username}</p>
            <p><strong>Role:</strong> {user.role}</p>
            <p><strong>Email:</strong> {user.email}</p>
          </div>
        ) : (
          <p>Not logged in</p>
        )}
      </div>

      <div className="mt-6">
        <a href="/debug" className="text-blue-600 hover:underline">
          Go to Debug Page
        </a>
      </div>
    </div>
  );
}