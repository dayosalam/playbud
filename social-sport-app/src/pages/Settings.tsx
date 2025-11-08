import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SettingsTab = "password" | "payments";

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("password");

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="space-y-2">
        {/* <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
          Account
        </p> */}
        <h1 className="text-3xl font-semibold text-foreground">Account Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your credentials and payment preferences for faster bookings.
        </p>
      </header>

      <section className="grid gap-8 md:grid-cols-[220px_1fr]">
        <nav className="flex flex-col gap-3 text-sm font-medium text-muted-foreground">
          <button
            type="button"
            onClick={() => setActiveTab("password")}
            className={`flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition ${
              activeTab === "password"
                ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
                : "hover:border-border hover:bg-muted/40"
            }`}
          >
            <span>Change Password</span>
            {activeTab === "password" && (
              <span className="ml-4 h-6 w-1 rounded-full bg-primary" />
            )}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("payments")}
            className={`flex items-center justify-between rounded-xl border border-transparent px-4 py-3 text-left transition ${
              activeTab === "payments"
                ? "border-primary/40 bg-primary/5 text-foreground shadow-sm"
                : "hover:border-border hover:bg-muted/40"
            }`}
          >
            <span>Payment Methods</span>
            {activeTab === "payments" && (
              <span className="ml-4 h-6 w-1 rounded-full bg-primary" />
            )}
          </button>
        </nav>

        <div className="rounded-3xl border border-border bg-card/60 p-8 shadow-sm backdrop-blur-sm">
          {activeTab === "password" ? (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold text-foreground">
                  Change Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Keep your account secure by updating your password regularly.
                </p>
              </header>
              <form className="space-y-5">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Current Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Enter your current password"
                    className="h-12 rounded-xl border-2 border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Choose a new password"
                    className="h-12 rounded-xl border-2 border-border bg-background focus:border-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-foreground">
                    Confirm New Password
                  </label>
                  <Input
                    type="password"
                    placeholder="Re-enter your new password"
                    className="h-12 rounded-xl border-2 border-border bg-background focus:border-primary"
                  />
                </div>
                <Button className="h-12 w-full rounded-xl bg-primary text-primary-foreground shadow-md hover:bg-primary/90">
                  Reset Password
                </Button>
              </form>
            </div>
          ) : (
            <div className="space-y-6">
              <header>
                <h2 className="text-xl font-semibold text-foreground">
                  Payment Methods
                </h2>
                <p className="text-sm text-muted-foreground">
                  Save cards and manage billing options for quick checkout.
                </p>
              </header>
              <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-border bg-muted/30 p-10 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-background shadow">
                  <span className="text-2xl font-semibold text-primary">+</span>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-foreground">
                    No payment methods saved
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add a card to speed up booking and secure your spot faster.
                  </p>
                </div>
                <Button className="rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground hover:bg-primary/90">
                  Add Card
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Settings;
