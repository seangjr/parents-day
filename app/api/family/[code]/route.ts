import { getRepo } from "@/lib/repo";
import { familyMix, type FamilyMember } from "@/lib/scoring";
import type { FamilyMemberView, FamilyView } from "@/components/family/types";

/**
 * Read a Family by code: its revealed members plus the live Family Love Mix
 * (ADR-0003). `members` are the Participants who have submitted; the mix is
 * computed only once two have revealed. `memberCount` is the joined total, so
 * the screen can tell "invite your family" from "waiting on their quizzes".
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
): Promise<Response> {
  const { code: raw } = await params;
  const code = raw.trim().toUpperCase();

  const repo = getRepo();
  const family = await repo.familyByCode(code);
  if (!family) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }

  const submissions = await repo.submissionsForFamily(code);
  const members: FamilyMemberView[] = submissions.map((s) => ({
    firstName: s.firstName,
    role: s.role,
    primary: s.primary,
  }));

  const mixMembers: FamilyMember[] = members.map((m) => ({
    primary: m.primary,
    role: m.role,
  }));
  const mix = mixMembers.length >= 2 ? familyMix(mixMembers) : null;

  const view: FamilyView = {
    code: family.code,
    name: family.name,
    memberCount: family.memberIds.length,
    members,
    mix,
  };
  return Response.json(view);
}
