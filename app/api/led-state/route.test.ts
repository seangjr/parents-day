import { beforeEach, describe, expect, test } from "bun:test";
import { getRepo } from "@/lib/repo";
import { GET } from "./route";

describe("GET /api/led-state", () => {
  beforeEach(async () => {
    await getRepo().reset();
  });

  test("includes a joined Family before its first Quiz Submission", async () => {
    const repo = getRepo();
    const { code } = await repo.createFamily("The Tan Family");
    await repo.joinFamily(code, "participant-1");

    const response = await GET(
      new Request("http://test/api/led-state?cursor=0"),
    );
    const body = (await response.json()) as {
      joinedTotal: number;
      aggregates: { total: number };
      families: Array<{
        code: string;
        name: string;
        memberCount: number;
        members: unknown[];
      }>;
    };

    expect(response.status).toBe(200);
    expect(body.joinedTotal).toBe(1);
    expect(body.aggregates.total).toBe(0);
    expect(body.families).toEqual([
      {
        code,
        name: "The Tan Family",
        memberCount: 1,
        members: [],
      },
    ]);
  });
});
