import React from "react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PopOutPipButton } from "../PopOutPipButton";
import { PipProvider } from "../PipContext";

describe("PopOutPipButton", () => {
  const defaultProps = {
    getPositionMs: () => 1000,
    onSeek: vi.fn(),
    onDragSeek: vi.fn(),
    togglePlay: vi.fn().mockResolvedValue(undefined),
    prevTrack: vi.fn(),
    nextTrack: vi.fn(),
    isSaved: false,
    toggleSaveTrack: vi.fn().mockResolvedValue(undefined),
    token: "mock-token",
  };

  afterEach(() => {
    delete (window as any).documentPictureInPicture;
    vi.restoreAllMocks();
  });

  it("renders null when documentPictureInPicture is not supported in window", () => {
    delete (window as any).documentPictureInPicture;
    const { container } = render(
      <PipProvider>
        <PopOutPipButton {...defaultProps} />
      </PipProvider>
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders Pop out button when documentPictureInPicture is supported", () => {
    (window as any).documentPictureInPicture = {
      requestWindow: vi.fn(),
    };

    render(
      <PipProvider>
        <PopOutPipButton {...defaultProps} />
      </PipProvider>
    );
    expect(screen.getByRole("button", { name: /Open floating mini-player/i })).toBeDefined();
  });

  it("calls documentPictureInPicture.requestWindow with width 340 and height 420 on click", async () => {
    const mockPipDoc = {
      title: "",
      head: { appendChild: vi.fn() },
      body: document.createElement("body"),
      documentElement: { style: { setProperty: vi.fn() } },
    };
    const mockPipWindow = {
      document: mockPipDoc,
      addEventListener: vi.fn(),
      closed: false,
      focus: vi.fn(),
    };

    const requestWindowMock = vi.fn().mockResolvedValue(mockPipWindow);
    (window as any).documentPictureInPicture = {
      requestWindow: requestWindowMock,
    };

    render(
      <PipProvider>
        <PopOutPipButton {...defaultProps} />
      </PipProvider>
    );
    const btn = screen.getByRole("button", { name: /Open floating mini-player/i });

    await act(async () => {
      fireEvent.click(btn);
    });

    expect(requestWindowMock).toHaveBeenCalledWith({ width: 340, height: 420 });
  });
});
