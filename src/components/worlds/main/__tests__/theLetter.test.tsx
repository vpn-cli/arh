import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import TheLetter from "../TheLetter";

vi.mock("@/lib/audio", () => ({
  sfx: {
    pop: vi.fn(),
    paper: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

describe("TheLetter Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders unopened vintage airmail envelope with seal and recipient", () => {
    render(<TheLetter />);

    expect(screen.getByText(/BREAK THE SEAL/i)).toBeDefined();
    expect(screen.getByText(/For: Maahi ✦ Tokyo, Japan/i)).toBeDefined();
    expect(
      screen.getByLabelText("Open birthday letter").getAttribute("aria-expanded")
    ).toBe("false");
  });

  it("opens letter on click and displays complete revised poem content", () => {
    render(<TheLetter />);

    const envelopeContainer = screen.getByLabelText("Open birthday letter");
    fireEvent.click(envelopeContainer);

    expect(envelopeContainer.getAttribute("aria-expanded")).toBe("true");

    // Check salutation and preamble
    expect(screen.getByText(/Dearest Maahi,/i)).toBeDefined();
    expect(
      screen.getByText(/why not try a poem for a change of pace/i)
    ).toBeDefined();
    expect(screen.getByText(/50 shades of Maahi/i)).toBeDefined();

    // Check key revised stanzas of the poem
    expect(
      screen.getByText(/A curious tale our timeline weaves/i)
    ).toBeDefined();
    expect(
      screen.getByText(/From Candy visits to TOEFL practice together/i)
    ).toBeDefined();
    expect(
      screen.getByText(/I'd say it was an administrative error, most likely/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Like a software bug that somehow deserves applause/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Two stubborn prosecutors with nowhere else to go/i)
    ).toBeDefined();
    expect(
      screen.getByText(/A library of stories with its shelves full of holes/i)
    ).toBeDefined();
    expect(
      screen.getByText(/And now thou art in Japan, pursuing thy master's degree/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Thou'd be the train delayed beyond all expectation/i)
    ).toBeDefined();
    expect(
      screen.getByText(/More music, more laughter, and Tokyo's neon at night/i)
    ).toBeDefined();
    expect(
      screen.getByText(/May our jam sessions survive the oceans between/i)
    ).toBeDefined();
    expect(
      screen.getByText(/May thy plans actually stay in thy head for a day/i)
    ).toBeDefined();
    expect(
      screen.getByText(/I'm rather glad our third year collided with mine/i)
    ).toBeDefined();
    expect(
      screen.getByText(/So happy birthday, Maahi, thou magnificent oddity/i)
    ).toBeDefined();
    expect(
      screen.getByText(/Just two idiots making excellent use of their time/i)
    ).toBeDefined();

    // Check climax & outro
    expect(screen.getByText(/✦ Happy Birthday, Maahi. ✦/i)).toBeDefined();
    expect(
      screen.getByText(/Thou mayst have Japan, a master's, and a degree to thy name/i)
    ).toBeDefined();
    expect(
      screen.getByText(/But escaping my nonsense was never part of the game. ♡/i)
    ).toBeDefined();
  });

  it("allows keyboard interaction (Enter / Space) to open", () => {
    render(<TheLetter />);
    const envelope = screen.getByLabelText("Open birthday letter");

    fireEvent.keyDown(envelope, { key: "Enter" });
    expect(envelope.getAttribute("aria-expanded")).toBe("true");
  });

  it("folds letter back when clicking FOLD LETTER BACK button", () => {
    render(<TheLetter />);
    const envelope = screen.getByLabelText("Open birthday letter");
    fireEvent.click(envelope);

    const foldBtn = screen.getByText(/FOLD LETTER BACK/i);
    fireEvent.click(foldBtn);

    expect(envelope.getAttribute("aria-expanded")).toBe("false");
  });
});
