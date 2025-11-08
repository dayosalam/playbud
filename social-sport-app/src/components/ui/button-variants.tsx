import { Button } from "./button";
import { cn } from "@/lib/utils";
import { ButtonProps } from "./button";

export const HeroButton = ({ className, ...props }: ButtonProps) => (
  <Button
    className={cn(
      "bg-gradient-primary text-primary-foreground hover:opacity-90 shadow-glow",
      "transition-all duration-300 hover:scale-105 hover:shadow-lg",
      className
    )}
    {...props}
  />
);

export const AchievementButton = ({ className, ...props }: ButtonProps) => (
  <Button
    className={cn(
      "bg-gradient-achievement text-achievement-foreground hover:opacity-90",
      "transition-all duration-300 hover:scale-105",
      className
    )}
    {...props}
  />
);

export const SuccessButton = ({ className, ...props }: ButtonProps) => (
  <Button
    className={cn(
      "bg-gradient-success text-success-foreground hover:opacity-90",
      "transition-all duration-300 hover:scale-105",
      className
    )}
    {...props}
  />
);
