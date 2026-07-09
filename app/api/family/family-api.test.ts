import { describe, test, expect, beforeEach } from "bun:test";
import { getRepo } from "@/lib/repo";
import { POST as createRoute } from "./create/route";
import { POST as joinRoute } from "./join/route";
import { GET as familyRoute } from "./[code]/route";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Confusion-safe Family Code: 3 safe letters (no I, O), dash, 2 chars from
 * the safe alphabet (same letters plus 2-9 digits, no 0/1).
 */
const CODE_RE =
  /^[ABCDEFGHJKLMNPQRSTUVWXYZ]{3}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{2}$/;

/** POST /api/family/create; returns status and parsed response body. */
async function postCreate(payload: unknown) {
  const res = await createRoute(
    new Request("http://t/api/family/create", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

/**
 * Create a family and return the minted code.
 * Throws on a non-200 to surface setup failures clearly.
 */
async function mintFamily(name: string): Promise<string> {
  const { status, body } = await postCreate({ name });
  if (status !== 200) throw new Error(`mintFamily: unexpected status ${status}`);
  return body.code as string;
}

/** POST /api/family/join; returns status and parsed response body. */
async function postJoin(payload: unknown) {
  const res = await joinRoute(
    new Request("http://t/api/family/join", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    }),
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

/** Join with well-formed fields (convenience wrapper). */
async function doJoin(code: string, participantId: string) {
  return postJoin({ code, participantId });
}

/** GET /api/family/[code]; returns status and parsed response body. */
async function getFamily(code: string) {
  const res = await familyRoute(
    new Request(`http://t/api/family/${code}`),
    { params: Promise.resolve({ code }) },
  );
  return { status: res.status, body: (await res.json()) as Record<string, unknown> };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("Family API routes", () => {
  beforeEach(async () => {
    await getRepo().reset();
  });

  // -------------------------------------------------------------------------
  // 1. POST /api/family/create
  // -------------------------------------------------------------------------

  describe("POST /api/family/create", () => {
    test("success: status 200 and code matches confusion-safe format", async () => {
      const { status, body } = await postCreate({ name: "Tan" });
      expect(status).toBe(200);
      expect(typeof body.code).toBe("string");
      expect(body.code).toMatch(CODE_RE);
    });

    test("blank name (whitespace-only) returns 400 bad_request", async () => {
      const { status, body } = await postCreate({ name: "   " });
      expect(status).toBe(400);
      expect(body.error).toBe("bad_request");
    });

    test("missing name field returns 400 bad_request", async () => {
      const { status, body } = await postCreate({});
      expect(status).toBe(400);
      expect(body.error).toBe("bad_request");
    });

    test("non-string name (number) returns 400 bad_request", async () => {
      const { status, body } = await postCreate({ name: 42 });
      expect(status).toBe(400);
      expect(body.error).toBe("bad_request");
    });
  });

  // -------------------------------------------------------------------------
  // 2. POST /api/family/join
  // -------------------------------------------------------------------------

  describe("POST /api/family/join", () => {
    test("success: status 200, ok:true, and familyName echoes the create name", async () => {
      const code = await mintFamily("Lim");
      const { status, body } = await doJoin(code, "p1");
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.familyName).toBe("Lim");
    });

    test("unknown code returns 404 not_found", async () => {
      const { status, body } = await doJoin("UNKN-ZZ", "p1");
      expect(status).toBe(404);
      expect(body.ok).toBe(false);
      expect(body.error).toBe("not_found");
    });

    test("11th distinct participant is rejected with 409 full", async () => {
      const code = await mintFamily("Chan");
      for (let i = 1; i <= 10; i++) {
        await doJoin(code, `member-${i}`);
      }
      const { status, body } = await doJoin(code, "member-11");
      expect(status).toBe(409);
      expect(body.ok).toBe(false);
      expect(body.error).toBe("full");
    });

    test("re-joining an existing member is idempotent: status 200, ok:true", async () => {
      const code = await mintFamily("Wong");
      await doJoin(code, "p1");
      const { status, body } = await doJoin(code, "p1"); // second join
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
    });

    test("missing code field returns 400 bad_request", async () => {
      const { status, body } = await postJoin({ participantId: "p1" });
      expect(status).toBe(400);
      expect(body.ok).toBe(false);
      expect(body.error).toBe("bad_request");
    });

    test("missing participantId field returns 400 bad_request", async () => {
      const code = await mintFamily("Lee");
      const { status, body } = await postJoin({ code });
      expect(status).toBe(400);
      expect(body.ok).toBe(false);
      expect(body.error).toBe("bad_request");
    });

    test("lower-cased and space-padded code normalises to the minted code and joins successfully", async () => {
      const code = await mintFamily("Yap");
      // The minted code is upper-case (e.g. "YAP-K7"); the join route trims + upper-cases.
      const { status, body } = await postJoin({
        code: `  ${code.toLowerCase()}  `,
        participantId: "p1",
      });
      expect(status).toBe(200);
      expect(body.ok).toBe(true);
      expect(body.familyName).toBe("Yap");
    });
  });

  // -------------------------------------------------------------------------
  // 3. GET /api/family/[code]
  // -------------------------------------------------------------------------

  describe("GET /api/family/[code]", () => {
    test("unknown code returns 404 not_found", async () => {
      const { status, body } = await getFamily("UNKN-ZZ");
      expect(status).toBe(404);
      expect(body.error).toBe("not_found");
    });

    test("known family with 0 submissions: members empty, mix null, memberCount reflects joined count", async () => {
      const code = await mintFamily("Ng");
      await doJoin(code, "p1");
      await doJoin(code, "p2");
      await doJoin(code, "p3");

      const { status, body } = await getFamily(code);
      expect(status).toBe(200);
      expect(body.code).toBe(code);
      expect(body.name).toBe("Ng");
      expect(body.memberCount).toBe(3);
      expect(body.members).toEqual([]);
      expect(body.mix).toBeNull();
    });

    test("two members both primary sayang: mix is dominant, dominantStyle sayang, counts sum equals 2", async () => {
      const code = await mintFamily("Ho");
      await doJoin(code, "p1");
      await doJoin(code, "p2");

      const repo = getRepo();
      await repo.recordSubmission({
        participantId: "p1",
        firstName: "Alice",
        role: "parent",
        familyCode: code,
        primary: "sayang",
        selfieUrl: null,
        ts: 1000,
      });
      await repo.recordSubmission({
        participantId: "p2",
        firstName: "Bob",
        role: "parent",
        familyCode: code,
        primary: "sayang",
        selfieUrl: null,
        ts: 2000,
      });

      const { status, body } = await getFamily(code);
      expect(status).toBe(200);

      const members = body.members as unknown[];
      expect(members.length).toBe(2);

      const mix = body.mix as {
        archetype: string;
        dominantStyle: string;
        headline: string;
        counts: Record<string, number>;
      } | null;
      expect(mix).not.toBeNull();
      expect(mix!.archetype).toBe("dominant");
      expect(mix!.dominantStyle).toBe("sayang");
      expect(mix!.headline).toBe("A Sayang Words Family.");

      const countsSum = Object.values(mix!.counts).reduce(
        (acc: number, n: number) => acc + n,
        0,
      );
      expect(countsSum).toBe(2);
    });
  });
});
