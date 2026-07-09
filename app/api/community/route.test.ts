import { describe, test, expect, beforeEach } from "bun:test";
import { GET } from "@/app/api/community/route";
import { POST } from "@/app/api/submit/route";
import { getRepo } from "@/lib/repo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface StyleEntry {
  id: string;
  count: number;
  pct: number;
}

interface CommunityBody {
  total: number;
  styles: StyleEntry[];
}

async function community(): Promise<{ res: Response; body: CommunityBody }> {
  const res = await GET();
  const body = (await res.json()) as CommunityBody;
  return { res, body };
}

/** Drive a submission through the real POST handler (never fabricate repo state). */
async function submit(
  participantId: string,
  primary: string,
  overrides: Record<string, unknown> = {},
): Promise<void> {
  await POST(
    new Request("http://localhost/api/submit", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        participantId,
        firstName: "Test",
        role: "child",
        primary,
        ...overrides,
      }),
    }),
  );
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("GET /api/community", () => {
  beforeEach(async () => {
    await getRepo().reset();
  });

  // -------------------------------------------------------------------------
  // Response structure
  // -------------------------------------------------------------------------

  test("always returns 200", async () => {
    const { res } = await community();
    expect(res.status).toBe(200);
  });

  test("styles array has exactly 5 entries in canonical order", async () => {
    const { body } = await community();
    expect(body.styles).toHaveLength(5);
    expect(body.styles[0].id).toBe("sayang");
    expect(body.styles[1].id).toBe("lepak");
    expect(body.styles[2].id).toBe("help");
    expect(body.styles[3].id).toBe("tapau");
    expect(body.styles[4].id).toBe("hug");
  });

  // -------------------------------------------------------------------------
  // Empty state (after reset)
  // -------------------------------------------------------------------------

  test("empty state: total 0, all five counts 0, all five pcts 0", async () => {
    const { body } = await community();
    expect(body.total).toBe(0);
    expect(body.styles).toEqual([
      { id: "sayang", count: 0, pct: 0 },
      { id: "lepak", count: 0, pct: 0 },
      { id: "help", count: 0, pct: 0 },
      { id: "tapau", count: 0, pct: 0 },
      { id: "hug", count: 0, pct: 0 },
    ]);
  });

  // -------------------------------------------------------------------------
  // Counts reflect posted primaries
  // -------------------------------------------------------------------------

  test("total and counts reflect posted primaries (only primary counts)", async () => {
    await submit("p1", "sayang");
    await submit("p2", "sayang");
    await submit("p3", "hug");
    const { body } = await community();
    expect(body.total).toBe(3);
    expect(body.styles[0].id).toBe("sayang");
    expect(body.styles[0].count).toBe(2);
    expect(body.styles[1].id).toBe("lepak");
    expect(body.styles[1].count).toBe(0);
    expect(body.styles[2].id).toBe("help");
    expect(body.styles[2].count).toBe(0);
    expect(body.styles[3].id).toBe("tapau");
    expect(body.styles[3].count).toBe(0);
    expect(body.styles[4].id).toBe("hug");
    expect(body.styles[4].count).toBe(1);
  });

  // -------------------------------------------------------------------------
  // Percentages
  // -------------------------------------------------------------------------

  test("single submission: that style pct = 100, all others pct = 0", async () => {
    await submit("p1", "tapau");
    const { body } = await community();
    expect(body.styles[0].id).toBe("sayang");
    expect(body.styles[0].pct).toBe(0);
    expect(body.styles[1].id).toBe("lepak");
    expect(body.styles[1].pct).toBe(0);
    expect(body.styles[2].id).toBe("help");
    expect(body.styles[2].pct).toBe(0);
    expect(body.styles[3].id).toBe("tapau");
    expect(body.styles[3].pct).toBe(100);
    expect(body.styles[4].id).toBe("hug");
    expect(body.styles[4].pct).toBe(0);
  });

  test(
    "three-way tie sayang+lepak+hug (one each) → exact pct vector 34/33/0/0/33" +
      " — canonical-order tie-break awards leftover point to sayang",
    async () => {
      await submit("p1", "sayang");
      await submit("p2", "lepak");
      await submit("p3", "hug");
      const { body } = await community();
      expect(body.total).toBe(3);
      // Each of sayang, lepak, hug = 1/3 * 100 ≈ 33.33 → floor 33; three-way remainder tie;
      // canonical order gives the leftover point to sayang (index 0).
      expect(body.styles).toEqual([
        { id: "sayang", count: 1, pct: 34 },
        { id: "lepak", count: 1, pct: 33 },
        { id: "help", count: 0, pct: 0 },
        { id: "tapau", count: 0, pct: 0 },
        { id: "hug", count: 1, pct: 33 },
      ]);
    },
  );

  test("pcts sum to exactly 100 whenever total > 0 (largest-remainder invariant)", async () => {
    // 7 submissions with uneven split: sayang×3, lepak×2, help×1, tapau×1
    for (let i = 0; i < 3; i++) await submit(`p-s${i}`, "sayang");
    for (let i = 0; i < 2; i++) await submit(`p-l${i}`, "lepak");
    await submit("p-h1", "help");
    await submit("p-t1", "tapau");
    const { body } = await community();
    expect(body.total).toBe(7);
    const pctSum = body.styles.reduce((acc, s) => acc + s.pct, 0);
    expect(pctSum).toBe(100);
  });
});
