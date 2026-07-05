/**
 * Component smoke tests — catch the class of bug the utils suites can't:
 * a page or shared component that throws on mount (bad import, missing
 * provider, undefined access) and would white-screen in production.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import NotFound from "@/pages/NotFound";
import Preferences from "@/pages/Preferences";

describe("smoke: NotFound", () => {
  it("renders the 404 screen", () => {
    render(
      <MemoryRouter initialEntries={["/nope"]}>
        <NotFound />
      </MemoryRouter>,
    );
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByText(/page not found/i)).toBeInTheDocument();
  });
});

describe("smoke: Preferences", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders values, dietary, brands and backup sections", () => {
    render(
      <MemoryRouter>
        <Preferences />
      </MemoryRouter>,
    );
    expect(screen.getByText("What matters to you?")).toBeInTheDocument();
    expect(screen.getByText("Labor & Human Rights")).toBeInTheDocument();
    expect(screen.getByText("Export backup")).toBeInTheDocument();
    expect(screen.getByText("Import backup")).toBeInTheDocument();
  });
});

describe("smoke: ErrorBoundary", () => {
  it("renders children when nothing throws", () => {
    render(
      <ErrorBoundary>
        <p>all good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText("all good")).toBeInTheDocument();
  });

  it("shows the crash screen instead of unmounting the app", () => {
    const Boom = () => {
      throw new Error("kaboom");
    };
    // React logs the caught error; silence it so the test output stays readable.
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    );
    spy.mockRestore();

    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /reload page/i })).toBeInTheDocument();
  });
});
