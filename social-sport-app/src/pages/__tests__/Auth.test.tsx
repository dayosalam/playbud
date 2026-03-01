import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Auth from "@/pages/Auth";

vi.mock("@/services/reference.service", () => ({
  fetchReferenceData: vi.fn().mockResolvedValue({
    cities: [{ slug: "lagos", name: "Lagos" }],
  }),
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ refreshUser: vi.fn() }),
}));

describe("Auth page", () => {
  it("shows login view by default", () => {
    render(
      <MemoryRouter initialEntries={["/auth"]}>
        <Auth />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /welcome back/i })).toBeInTheDocument();
  });

  it("shows signup view when mode=signup", () => {
    render(
      <MemoryRouter initialEntries={["/auth?mode=signup"]}>
        <Auth />
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: /create account/i })).toBeInTheDocument();
  });
});
