import { describe, test, expect, beforeEach } from "bun:test";
import { MemoryRepository } from "./memory";
import type { Submission } from "./types";
import type { LoveStyleId } from "@/lib/love-styles";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSub(
  participantId: string,
  primary: LoveStyleId = "sayang",
  overrides: Partial<Submission> = {},
): Submission {
  return {
    participantId,
    firstName: "Test",
    role: "child",
    familyCode: null,
    primary,
    selfieUrl: null,
    ts: 1000,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("MemoryRepository", () => {
  let repo: MemoryRepository;

  beforeEach(() => {
    repo = new MemoryRepository();
  });

  // -------------------------------------------------------------------------
  // 1. Idempotent retake keeps counters honest
  // -------------------------------------------------------------------------
  describe("recordSubmission — idempotent retake keeps counters honest", () => {
    test("first submission increments style count and total", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      const agg = await repo.aggregates();
      expect(agg.counts.sayang).toBe(1);
      expect(agg.total).toBe(1);
    });

    test("retake to a different style moves the count; total stays at 1", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      await repo.recordSubmission(makeSub("p1", "lepak")); // retake
      const agg = await repo.aggregates();
      expect(agg.counts.sayang).toBe(0);
      expect(agg.counts.lepak).toBe(1);
      expect(agg.total).toBe(1); // not 2
    });

    test("retake to the same style leaves count and total at 1", async () => {
      await repo.recordSubmission(makeSub("p1", "hug"));
      await repo.recordSubmission(makeSub("p1", "hug")); // same style retake
      const agg = await repo.aggregates();
      expect(agg.counts.hug).toBe(1);
      expect(agg.total).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // 2. Retakes don't re-enqueue the log
  // -------------------------------------------------------------------------
  describe("submissionLog — retakes do not re-enqueue", () => {
    test("first submission produces exactly one log entry", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      const { entries } = await repo.submissionLog(0);
      expect(entries).toHaveLength(1);
    });

    test("retake by the same participant does not append a second entry", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      await repo.recordSubmission(makeSub("p1", "lepak")); // retake
      const { entries } = await repo.submissionLog(0);
      expect(entries).toHaveLength(1);
    });

    test("a different participant appends a second log entry", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      await repo.recordSubmission(makeSub("p1", "lepak")); // retake — no enqueue
      await repo.recordSubmission(makeSub("p2", "hug")); // new participant
      const { entries } = await repo.submissionLog(0);
      expect(entries).toHaveLength(2);
    });

    test("cursor paging: returned cursor equals entry count; next poll is empty", async () => {
      await repo.recordSubmission(makeSub("p1", "sayang"));
      await repo.recordSubmission(makeSub("p2", "lepak"));
      const page1 = await repo.submissionLog(0);
      expect(page1.entries).toHaveLength(2);
      expect(page1.cursor).toBe(2);
      const page2 = await repo.submissionLog(page1.cursor);
      expect(page2.entries).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // 3. createFamily mints unique, confusion-safe codes
  // -------------------------------------------------------------------------
  describe("createFamily — unique confusion-safe codes", () => {
    test("code matches the confusion-safe format and excludes banned glyphs", async () => {
      const { code } = await repo.createFamily("Tan");
      expect(code).toMatch(/^[A-Z]{3}-[A-Z2-9]{2}$/);
      expect(code).not.toMatch(/[OI01]/);
    });

    test("50 families each get a distinct code", async () => {
      const codes = await Promise.all(
        Array.from({ length: 50 }, (_, i) =>
          repo.createFamily(`Family ${i}`).then((r) => r.code),
        ),
      );
      expect(new Set(codes).size).toBe(50);
    });

    test("familyByCode returns the created family with correct code, name, empty members, and numeric timestamp", async () => {
      const before = Date.now();
      const { code } = await repo.createFamily("Lim");
      const family = await repo.familyByCode(code);
      expect(family).not.toBeNull();
      expect(family!.code).toBe(code);
      expect(family!.name).toBe("Lim");
      expect(family!.memberIds).toHaveLength(0);
      expect(typeof family!.createdTs).toBe("number");
      expect(family!.createdTs).toBeGreaterThanOrEqual(before);
    });

    test("familyByCode returns null for an unknown code", async () => {
      const result = await repo.familyByCode("NOPE-22");
      expect(result).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // 4. joinFamily enforces cap 10
  // -------------------------------------------------------------------------
  describe("joinFamily — cap of 10 members", () => {
    test("10 distinct participants each return ok:true and memberIds grows in join order", async () => {
      const { code } = await repo.createFamily("Chan");
      for (let i = 1; i <= 10; i++) {
        const result = await repo.joinFamily(code, `member-${i}`);
        expect(result.ok).toBe(true);
        if (result.ok) {
          expect(result.family.memberIds).toHaveLength(i);
        }
      }
    });

    test("11th distinct participant is rejected with error full", async () => {
      const { code } = await repo.createFamily("Lee");
      for (let i = 1; i <= 10; i++) {
        await repo.joinFamily(code, `p${i}`);
      }
      const result = await repo.joinFamily(code, "p11");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("full");
      }
    });

    test("familyByCode still shows exactly 10 members after a rejected 11th join", async () => {
      const { code } = await repo.createFamily("Wong");
      for (let i = 1; i <= 10; i++) {
        await repo.joinFamily(code, `member-${i}`);
      }
      await repo.joinFamily(code, "overflow");
      const family = await repo.familyByCode(code);
      expect(family!.memberIds).toHaveLength(10);
    });

    test("unknown code returns ok:false with error not_found", async () => {
      const result = await repo.joinFamily("UNKN-XZ", "p1");
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toBe("not_found");
      }
    });

    test("re-joining an already-joined participant is idempotent: ok:true, no duplicate", async () => {
      const { code } = await repo.createFamily("Yap");
      await repo.joinFamily(code, "p1");
      const result = await repo.joinFamily(code, "p1"); // rejoin
      expect(result.ok).toBe(true);
      const family = await repo.familyByCode(code);
      expect(family!.memberIds).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // 5. aggregates reflect all distinct participant submissions
  // -------------------------------------------------------------------------
  describe("aggregates — reflect multiple participants across styles", () => {
    test("counts per style and total match the distinct participants recorded", async () => {
      await repo.recordSubmission(makeSub("a1", "sayang"));
      await repo.recordSubmission(makeSub("a2", "sayang"));
      await repo.recordSubmission(makeSub("a3", "hug"));
      await repo.recordSubmission(makeSub("a4", "tapau"));
      const agg = await repo.aggregates();
      expect(agg.counts.sayang).toBe(2);
      expect(agg.counts.hug).toBe(1);
      expect(agg.counts.tapau).toBe(1);
      expect(agg.counts.lepak).toBe(0);
      expect(agg.counts.help).toBe(0);
      expect(agg.total).toBe(4);
    });
  });

  // -------------------------------------------------------------------------
  // 6. submissionsForFamily
  // -------------------------------------------------------------------------
  describe("submissionsForFamily — members who submitted, non-submitters omitted", () => {
    test("returns submissions for p1 and p2; p3 joined but never submitted is omitted", async () => {
      const { code } = await repo.createFamily("Ng");
      await repo.joinFamily(code, "p1");
      await repo.joinFamily(code, "p2");
      await repo.joinFamily(code, "p3"); // never submits
      await repo.recordSubmission(makeSub("p1", "sayang", { familyCode: code }));
      await repo.recordSubmission(makeSub("p2", "lepak", { familyCode: code }));
      const submissions = await repo.submissionsForFamily(code);
      expect(submissions).toHaveLength(2);
      const ids = submissions.map((s) => s.participantId);
      expect(ids).toContain("p1");
      expect(ids).toContain("p2");
    });
  });

  // -------------------------------------------------------------------------
  // 7. reset clears everything
  // -------------------------------------------------------------------------
  describe("reset — clears aggregates, log, and families", () => {
    test("after reset all counts are 0, log is empty, and the family is gone", async () => {
      const { code } = await repo.createFamily("Foo");
      await repo.joinFamily(code, "p1");
      await repo.recordSubmission(makeSub("p1", "sayang"));

      await repo.reset();

      const agg = await repo.aggregates();
      expect(agg.total).toBe(0);
      expect(agg.counts.sayang).toBe(0);
      expect(agg.counts.lepak).toBe(0);
      expect(agg.counts.help).toBe(0);
      expect(agg.counts.tapau).toBe(0);
      expect(agg.counts.hug).toBe(0);

      const { entries } = await repo.submissionLog(0);
      expect(entries).toHaveLength(0);

      const family = await repo.familyByCode(code);
      expect(family).toBeNull();
    });
  });
});
