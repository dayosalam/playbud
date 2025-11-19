import { Instagram, Linkedin, X } from "lucide-react";
import { Link } from "react-router-dom";
import brandIcon from "@/assets/icon.png";

const sportLinks = [
  { label: "Basketball", code: "BASKETBALL" },
  { label: "Football", code: "FOOTBALL" },
  { label: "Volleyball", code: "VOLLEYBALL" },
  { label: "Tennis", code: "TENNIS" },
];

export function AppFooter() {
  return (
    <footer className="bg-muted/30 py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-5 gap-8 max-w-6xl mx-auto">
          <div>
            <h3 className="font-semibold mb-4">Find a Game</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {sportLinks.map((sport) => (
                <li key={sport.code}>
                  <Link
                    to={`/find-game?sport=${encodeURIComponent(sport.code)}`}
                    className="hover:text-primary transition-colors"
                  >
                    {sport.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li> <Link to="/" className="hover:text-primary transition-colors">About</Link>
              </li>
              <li>
                <Link to="/find-game" className="hover:text-primary transition-colors">
                  Find a game
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Policies</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Office</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>Plot 790, Alimoh-Abu Street,</li>
              <li>Behind VIO Yard, Wuye District,</li>
              <li>Abuja, Nigeria</li>
              <li>dayosalamboi@gmail.com</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-4">Follow us</h3>
            <div className="flex gap-3">
              <a href="https://www.instagram.com/dayosalam11/" className="hover:text-primary transition-colors">
                <Instagram className="w-5 h-5" />
              </a>
              <a href="https://www.linkedin.com/in/abdulwaheed-abdulsalam-b803b8153/" className="hover:text-primary transition-colors">
                <Linkedin className="w-5 h-5" />
              </a>
              <a href="https://x.com/dayo_salam" className="hover:text-primary transition-colors">
                <X className="w-5 h-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-border text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={brandIcon} alt="PlayBud" className="h-8 w-8 rounded-full object-cover" />
            <span className="text-xl font-bold">
              <span className="text-[#e8702c]">Play</span>
              <span className="text-[#223c61]">Bud</span>
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 PlayBud. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
