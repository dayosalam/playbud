import { FormEvent, useState } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { requestPasswordReset } from "@/services/auth.service";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) {
      toast({ title: "Missing email", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setIsSubmitting(true);
    try {
      await requestPasswordReset(email.trim().toLowerCase());
      toast({ title: "Check your inbox", description: "If the email exists, you'll receive a reset link shortly." });
      navigate("/auth");
    } catch (error) {
      toast({ title: "Request failed", description: "We couldn't process that request." , variant: "destructive"});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md space-y-6 rounded-3xl border-border bg-background p-8">
        <div className="space-y-2 text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">PlayBud</p>
          <h1 className="text-2xl font-semibold text-foreground">Forgot password</h1>
          <p className="text-sm text-muted-foreground">
            Enter the email linked to your account and we'll send you reset instructions.
          </p>
        </div>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="reset-email">Email address</Label>
            <Input
              id="reset-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="h-12"
            />
          </div>
          <Button className="w-full rounded-full" disabled={isSubmitting}>
            {isSubmitting ? "Sending..." : "Send reset link"}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={() => navigate(-1)}>
            Back to login
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default ForgotPassword;
