import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getCurrentUser } from "./utils/auth";
import { UserRole } from "@/convex/validation";

export default async function AdminPage() {
    try {
        // Check that the user is authenticated and has admin role
        const user = await getCurrentUser();

        if (!user || user.role !== "admin") {
            redirect("/dashboard");
        }

        return (
            <div className="container mx-auto py-10">
                <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="bg-card text-card-foreground shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">Database Migrations</h2>
                        <p className="text-muted-foreground mb-4">
                            Manage database schema migrations, run pending migrations, and view migration history.
                        </p>
                        <Link href="/admin/migrations">
                            <Button>Manage Migrations</Button>
                        </Link>
                    </div>

                    <div className="bg-card text-card-foreground shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">User Management</h2>
                        <p className="text-muted-foreground mb-4">
                            Manage users, update roles, and handle account issues.
                        </p>
                        <Link href="/admin/users">
                            <Button variant="outline">Manage Users</Button>
                        </Link>
                    </div>

                    <div className="bg-card text-card-foreground shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold mb-4">System Status</h2>
                        <p className="text-muted-foreground mb-4">
                            View system health, API limits, and performance metrics.
                        </p>
                        <Link href="/admin/system">
                            <Button variant="outline">View Status</Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error("Error in AdminPage:", error);
        redirect("/dashboard");
    }
}