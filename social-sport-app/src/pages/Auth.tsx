import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "@/hooks/use-toast";
import signupHero from "@/assets/signup-hero.png";
import { AppFooter } from "@/components/AppFooter";
import { login as apiLogin, signup as apiSignup } from "@/services/auth.service";
import { fetchReferenceData } from "@/services/reference.service";
import { useAuth } from "@/contexts/AuthContext";


const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [preferredCity, setPreferredCity] = useState("");
  const [heardAbout, setHeardAbout] = useState("");
  const [cityOptions, setCityOptions] = useState<Array<{ value: string; label: string }>>([]);
  const { refreshUser } = useAuth();

  // Listen for URL parameter changes
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setIsSignup(searchParams.get('mode') === 'signup');
  }, [location.search]);

  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const data = await fetchReferenceData();
        if (data.cities?.length) {
          const options = data.cities.map((city) => ({
            value: city.slug,
            label: city.name,
          }));
          setCityOptions(options);
          setPreferredCity((current) => current || options[0]?.value || "");
        }
      } catch (error) {
        console.error("Failed to load cities", error);
      }
    };
    loadReferenceData();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const password = (formData.get("password") as string) || "";

    try {
      await apiLogin({ email, password });
      await refreshUser();
      toast({
        title: "Welcome back!",
        description: "You've successfully logged in.",
      });
      navigate("/find-game");
    } catch (error: any) {
      toast({
        title: "Login failed",
        description: error?.message || "Unable to sign you in right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = ((formData.get("email") as string) || "").trim().toLowerCase();
    const password = (formData.get("password") as string) || "";
    const name = (formData.get("name") as string) || "";

    const selectedCity = preferredCity || ((formData.get("city") as string) || "");
    const selectedHeardAbout = heardAbout || ((formData.get("source") as string) || "");

    if (!selectedHeardAbout) {
      toast({
        title: "Tell us more",
        description: "Please let us know how you heard about PlayBud.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    try {
      await apiSignup({
        email,
        password,
        name,
        preferredCity: selectedCity || null,
        heardAbout: selectedHeardAbout || null,
      });
      await refreshUser();
      toast({
        title: "Account created!",
        description: "Welcome to PlayBud!",
      });
      navigate("/find-game");
    } catch (error: any) {
      toast({
        title: "Signup failed",
        description: error?.message || "Unable to create your account right now.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const handleForgotPassword = () => {
    navigate("/forgot-password");
  };
  

  if (isSignup) {
    return (
      <div className="min-h-screen flex flex-col">
        <div className="flex flex-1">
          {/* Left side - Form */}
          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Create Account</h1>
            </div>

            <form onSubmit={handleSignup} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="signup-name">Full name</Label>
                <Input
                  id="signup-name"
                  name="name"
                  type="text"
                  placeholder=""
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-email">Email address</Label>
                <Input
                  id="signup-email"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  required
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  minLength={8}
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="city">Preferred city</Label>
                <Select defaultValue="Abuja" value={preferredCity} onValueChange={setPreferredCity}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cityOptions.length ? (
                      cityOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="loading" disabled>
                        Loading cities...
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* <div className="space-y-2">
                <Label htmlFor="referral">Referral code (optional)</Label>
                <Input
                  id="referral"
                  name="referral"
                  type="text"
                  placeholder=""
                  className="h-12"
                />
              </div> */}

              <div className="space-y-2">
                <Label htmlFor="source">How did you hear about us?</Label>
                <Select value={heardAbout || undefined} onValueChange={setHeardAbout}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Select choice" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="social">Social Media</SelectItem>
                    <SelectItem value="friend">Friend</SelectItem>
                    <SelectItem value="search">Search Engine</SelectItem>
                    <SelectItem value="ad">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 hover:bg-[#FF8B6A]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Creating account..." : "Continue"}
              </Button>

              <div className="text-center text-sm">
                Already have an account?{" "}
              <button
                type="button"
                onClick={() => navigate("/auth")}
                className="text-primary hover:underline font-medium"
              >
                Login
              </button>
              </div>
            </form>
          </div>
        </div>

          {/* Right side - Image */}
          <div className="hidden lg:block lg:w-1/2 relative">
            <img
              src={signupHero}
              alt="Sports activity"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </div>

      <AppFooter />
    </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex flex-1">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md space-y-8">
            <div>
              <h1 className="text-3xl font-bold">Welcome Back</h1>
              <p className="text-muted-foreground mt-2">Sign in to continue to PlayBud</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email address</Label>
                <Input
                  id="login-email"
                  name="email"
                  type="email"
                  placeholder="example@gmail.com"
                  required
                  className="h-12"
                />
              </div>
              
              <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  className="h-12"
                />
                <div className="flex items-center justify-between">
                  
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                    onClick={() => handleForgotPassword()}
                  >
                    Forgot password?
                  </button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full h-12 hover:bg-[#FF8B6A]/90 text-white"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>

              <div className="text-center text-sm">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="text-primary hover:underline font-medium"
                >
                  Sign up
                </button>
              </div>
            </form>

            <div className="text-center">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-muted-foreground hover:text-foreground"
              >
                Back to Home
              </Button>
            </div>
          </div>
        </div>

        {/* Right side - Image */}
        <div className="hidden lg:block lg:w-1/2 relative">
          <img
            src={signupHero}
            alt="Sports activity"
            className="absolute inset-0 w-full h-full object-cover"
          />
        </div>
      </div>

    {/* Footer */}
    <AppFooter />

  </div>
  );
};

export default Auth;
