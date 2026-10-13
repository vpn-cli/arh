import { NextResponse } from "next/server";

export type QuestionPayload = {
  id: string;
  topic: string;
  prompt: string;
  answer: number;
  hint: string;
  source: "opentdb" | "generator";
};

// In-memory cache to prevent hitting OpenTDB rate limit (1 req / 5s)
let cachedWebQuestions: QuestionPayload[] = [];
let lastFetchTime = 0;

function decodeHtml(html: string): string {
  return html
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&deg;/g, "°")
    .replace(/&pi;/g, "π")
    .replace(/&eacute;/g, "é")
    .replace(/&ouml;/g, "ö")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)));
}

function generateProceduralQuestion(): QuestionPayload {
  const types = ["mul", "add", "sub", "div", "power", "fact"] as const;
  const choice = types[Math.floor(Math.random() * types.length)];
  const id = `proc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

  switch (choice) {
    case "mul": {
      const a = Math.floor(Math.random() * 10) + 3; // 3 to 12
      const b = Math.floor(Math.random() * 8) + 4;  // 4 to 11
      return {
        id,
        topic: "EASY ARITHMETIC",
        prompt: `Solve for the integer:  ${a} × ${b}  =  ?`,
        answer: a * b,
        hint: `Times table practice! Think: ${a} × ${b}.`,
        source: "generator",
      };
    }
    case "add": {
      const a = Math.floor(Math.random() * 50) + 15;
      const b = Math.floor(Math.random() * 50) + 12;
      return {
        id,
        topic: "MENTAL MATH",
        prompt: `Evaluate:  ${a} + ${b}  =  ?`,
        answer: a + b,
        hint: `Add tens first: ${Math.floor(a / 10) * 10} + ${Math.floor(b / 10) * 10}!`,
        source: "generator",
      };
    }
    case "sub": {
      const b = Math.floor(Math.random() * 35) + 15;
      const ans = Math.floor(Math.random() * 45) + 10;
      const a = b + ans;
      return {
        id,
        topic: "MENTAL MATH",
        prompt: `Evaluate:  ${a} - ${b}  =  ?`,
        answer: ans,
        hint: `Count up from ${b} to ${a}!`,
        source: "generator",
      };
    }
    case "div": {
      const b = Math.floor(Math.random() * 8) + 3; // 3 to 10
      const ans = Math.floor(Math.random() * 10) + 2; // 2 to 11
      const a = b * ans;
      return {
        id,
        topic: "EASY ARITHMETIC",
        prompt: `Evaluate:  ${a} ÷ ${b}  =  ?`,
        answer: ans,
        hint: `What number multiplied by ${b} equals ${a}?`,
        source: "generator",
      };
    }
    case "power": {
      const base = Math.floor(Math.random() * 3) + 2; // 2 to 4
      const exp = base === 2 ? Math.floor(Math.random() * 4) + 2 : 2; // 2^2 to 2^5 or 3^2, 4^2
      const ans = Math.pow(base, exp);
      return {
        id,
        topic: "EXPONENTS",
        prompt: `Evaluate:  ${base}^${exp}  =  ?`,
        answer: ans,
        hint: `${base} multiplied by itself ${exp} times!`,
        source: "generator",
      };
    }
    case "fact": {
      const facts = [
        { q: "How many sides does an octagon have?", a: 8, h: "Think of an octopus!" },
        { q: "How many degrees are in a right angle?", a: 90, h: "A quarter turn in a circle." },
        { q: "How many days are in a standard leap year?", a: 366, h: "One day more than normal." },
        { q: "How many seconds are in 3 minutes?", a: 180, h: "60 seconds per minute!" },
        { q: "How many centimeters are in 2 meters?", a: 200, h: "100 cm in one meter." },
        { q: "What is 25% of 80?", a: 20, h: "Divide 80 by 4!" },
        { q: "How many sides does a hexagon have?", a: 6, h: "Six-sided polygon!" },
        { q: "What is the square root of 81?", a: 9, h: "What number squared gives 81?" },
        { q: "How many degrees make a full circle?", a: 360, h: "Full 360 rotation!" },
        { q: "How many hours are in 2 full days?", a: 48, h: "24 hours each day." },
      ];
      const pick = facts[Math.floor(Math.random() * facts.length)];
      return {
        id,
        topic: "NUMERICAL TRIVIA",
        prompt: `${pick.q}  =  ?`,
        answer: pick.a,
        hint: pick.h,
        source: "generator",
      };
    }
  }
}

export async function GET() {
  const now = Date.now();

  // Try to refill web cache if older than 60s
  if (cachedWebQuestions.length === 0 || now - lastFetchTime > 60000) {
    try {
      const res = await fetch("https://opentdb.com/api.php?amount=20&category=19&difficulty=easy", {
        headers: { Accept: "application/json" },
      });

      if (res.ok) {
        const data = await res.json();
        if (data.response_code === 0 && Array.isArray(data.results)) {
          const numericalOnly: QuestionPayload[] = data.results
            .map((item: { question: string; correct_answer: string; difficulty?: string }, idx: number) => {
              const rawAns = decodeHtml(item.correct_answer || "").trim();
              const parsed = parseInt(rawAns, 10);
              // Only keep easy numerical answers (integers between -1000 and 1000)
              if (isNaN(parsed) || !/^-?\d+$/.test(rawAns) || Math.abs(parsed) > 1000) {
                return null;
              }
              return {
                id: `web-opentdb-${idx}-${Date.now()}`,
                topic: "WEB MATH TRIVIA",
                prompt: `${decodeHtml(item.question)}  =  ?`,
                answer: parsed,
                hint: `It's a straightforward integer answer!`,
                source: "opentdb" as const,
              };
            })
            .filter((q: QuestionPayload | null): q is QuestionPayload => q !== null);

          if (numericalOnly.length > 0) {
            cachedWebQuestions = numericalOnly;
            lastFetchTime = now;
          }
        }
      }
    } catch {
      // Safe fallback if external API is unreachable or rate limited
    }
  }

  // If we have cached web questions, return a random one
  if (cachedWebQuestions.length > 0) {
    const randomWebQ = cachedWebQuestions[Math.floor(Math.random() * cachedWebQuestions.length)];
    return NextResponse.json(randomWebQ);
  }

  // Otherwise, return procedural easy question
  const fallbackQ = generateProceduralQuestion();
  return NextResponse.json(fallbackQ);
}
