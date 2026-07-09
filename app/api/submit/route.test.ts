import { describe, test, expect, beforeEach } from "bun:test";
import { POST } from "@/app/api/submit/route";
import { getRepo } from "@/lib/repo";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a well-formed submit Request whose body is the JSON-serialised payload. */
function makeRequest(payload: unknown): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

/** Build a submit Request with a raw string body for JSON-parse edge cases. */
function makeRawRequest(raw: string): Request {
  return new Request("http://localhost/api/submit", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw,
  });
}

/** Minimal valid submission payload (no optional fields). */
const VALID = {
  participantId: "p-001",
  firstName: "Alice",
  role: "parent",
  primary: "sayang",
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("POST /api/submit", () => {
  beforeEach(async () => {
    await getRepo().reset();
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  test("valid submit → 200 { ok: true }", async () => {
    const res = await POST(makeRequest(VALID));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });

  test("valid submit → aggregate total increments to 1 and primary count increments", async () => {
    await POST(makeRequest(VALID));
    const { counts, total } = await getRepo().aggregates();
    expect(total).toBe(1);
    expect(counts["sayang"]).toBe(1);
    expect(counts["lepak"]).toBe(0);
    expect(counts["help"]).toBe(0);
    expect(counts["tapau"]).toBe(0);
    expect(counts["hug"]).toBe(0);
  });

  test("valid submit → appended to submissionLog with posted fields and server-stamped ts", async () => {
    const before = Date.now();
    await POST(makeRequest(VALID));
    const { entries } = await getRepo().submissionLog();
    expect(entries).toHaveLength(1);
    expect(entries[0].participantId).toBe("p-001");
    expect(entries[0].firstName).toBe("Alice");
    expect(entries[0].role).toBe("parent");
    expect(entries[0].primary).toBe("sayang");
    expect(entries[0].ts).toBeGreaterThanOrEqual(before);
  });

  // -------------------------------------------------------------------------
  // Optional field normalisation
  // -------------------------------------------------------------------------

  test("omitted familyCode and selfieUrl are stored as null", async () => {
    await POST(makeRequest(VALID));
    const { entries } = await getRepo().submissionLog();
    expect(entries[0].familyCode).toBeNull();
    expect(entries[0].selfieUrl).toBeNull();
  });

  test("explicit null familyCode and selfieUrl are stored as null", async () => {
    await POST(makeRequest({ ...VALID, familyCode: null, selfieUrl: null }));
    const { entries } = await getRepo().submissionLog();
    expect(entries[0].familyCode).toBeNull();
    expect(entries[0].selfieUrl).toBeNull();
  });

  test("provided familyCode and selfieUrl are stored verbatim", async () => {
    await POST(
      makeRequest({ ...VALID, familyCode: "FAM-XYZ", selfieUrl: "https://cdn.example.com/selfie.jpg" }),
    );
    const { entries } = await getRepo().submissionLog();
    expect(entries[0].familyCode).toBe("FAM-XYZ");
    expect(entries[0].selfieUrl).toBe("https://cdn.example.com/selfie.jpg");
  });

  // -------------------------------------------------------------------------
  // Idempotent retake (same participantId, different primary)
  // -------------------------------------------------------------------------

  describe("idempotent retake — same participantId, different primary", () => {
    test("total stays 1 after retake", async () => {
      await POST(makeRequest(VALID)); // primary: sayang
      await POST(makeRequest({ ...VALID, primary: "lepak" }));
      const { total } = await getRepo().aggregates();
      expect(total).toBe(1);
    });

    test("old style count drops to 0, new style count rises to 1", async () => {
      await POST(makeRequest(VALID)); // primary: sayang
      await POST(makeRequest({ ...VALID, primary: "lepak" }));
      const { counts } = await getRepo().aggregates();
      expect(counts["sayang"]).toBe(0);
      expect(counts["lepak"]).toBe(1);
    });

    test("submissionLog still has exactly one entry after retake", async () => {
      await POST(makeRequest(VALID));
      await POST(makeRequest({ ...VALID, primary: "lepak" }));
      const { entries } = await getRepo().submissionLog();
      expect(entries).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 400 validation — aggregates MUST remain unchanged after any rejection
  // -------------------------------------------------------------------------

  describe("400 cases — rejected submissions must not mutate aggregates", () => {
    async function expect400(req: Request): Promise<void> {
      const res = await POST(req);
      expect(res.status).toBe(400);
      const body = (await res.json()) as { ok: boolean };
      expect(body.ok).toBe(false);
      const { total } = await getRepo().aggregates();
      expect(total).toBe(0);
    }

    test("non-object JSON body (string literal 'null') → 400, total unchanged", async () => {
      await expect400(makeRawRequest("null"));
    });

    test("array body '[]' (valid JSON, not an object) → 400, total unchanged", async () => {
      await expect400(makeRawRequest("[]"));
    });

    test("unparseable JSON text → 400, total unchanged", async () => {
      await expect400(makeRawRequest("{bad json!!!"));
    });

    test("missing participantId → 400, total unchanged", async () => {
      await expect400(
        makeRequest({ firstName: "Alice", role: "parent", primary: "sayang" }),
      );
    });

    test("empty-string participantId → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, participantId: "" }));
    });

    test("missing firstName → 400, total unchanged", async () => {
      await expect400(
        makeRequest({ participantId: "p-001", role: "parent", primary: "sayang" }),
      );
    });

    test("empty-string firstName → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, firstName: "" }));
    });

    test("role not in enum ('nephew') → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, role: "nephew" }));
    });

    test("primary not in enum ('touch') → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, primary: "touch" }));
    });

    test("familyCode is a number (non-string non-null) → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, familyCode: 42 }));
    });

    test("selfieUrl is a number (non-string non-null) → 400, total unchanged", async () => {
      await expect400(makeRequest({ ...VALID, selfieUrl: 99 }));
    });
  });
});
