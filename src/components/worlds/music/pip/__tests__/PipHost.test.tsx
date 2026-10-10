import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { PipHost } from "../PipHost";
import { PipContext, PipContextValue } from "../PipContext";
import { useSpotifyPlayerStore } from "@/store/spotifyStore";

vi.mock("@/hooks/useSpotify", () => ({
  useSpotifySession: () => ({ data: { accessToken: "test-token" } }),
  useTrackSavedStatus: () => ({ data: false }),
  useSpotifyMutations: () => ({
    toggleSave: { mutateAsync: vi.fn().mockResolvedValue(undefined) },
  }),
}));

describe("PipHost", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useSpotifyPlayerStore.setState({
      currentTrack: {
        id: "pip-track-1",
        name: "Floating Track",
        artists: [{ name: "Pixel Artist" }],
        album: { name: "Album 1", images: [{ url: "https://example.com/art.png" }] },
      } as any,
      isPaused: false,
      duration: 180000,
    });
  });

  it("renders null when pipWindow is not open", () => {
    const pipContextValue: PipContextValue = {
      isSupported: true,
      isOpen: false,
      pipWindow: null,
      openPip: vi.fn(),
      closePip: vi.fn(),
      togglePip: vi.fn(),
    };

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <PipContext.Provider value={pipContextValue}>
          <PipHost />
        </PipContext.Provider>
      </QueryClientProvider>
    );

    expect(container.firstChild).toBeNull();
  });

  it("portals MiniPlayer into pipWindow.document.body when open", async () => {
    const mockPipBody = document.createElement("body");
    const mockPipDoc = {
      body: mockPipBody,
      createElement: (tag: string) => document.createElement(tag),
    };
    const mockPipWindow = {
      document: mockPipDoc,
      addEventListener: vi.fn(),
      closed: false,
      focus: vi.fn(),
    } as unknown as Window;

    const pipContextValue: PipContextValue = {
      isSupported: true,
      isOpen: true,
      pipWindow: mockPipWindow,
      openPip: vi.fn(),
      closePip: vi.fn(),
      togglePip: vi.fn(),
    };

    render(
      <QueryClientProvider client={queryClient}>
        <PipContext.Provider value={pipContextValue}>
          <PipHost />
        </PipContext.Provider>
      </QueryClientProvider>
    );

    // MiniPlayer is lazy loaded; query inside the portal target mockPipBody
    const title = await within(mockPipBody).findByText("Floating Track");
    expect(title).toBeDefined();
    expect(mockPipBody.contains(title)).toBe(true);
  });
});
