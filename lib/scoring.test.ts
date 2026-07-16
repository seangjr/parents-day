import { describe, test, expect } from "bun:test";
import type { QuizAnswer } from "./love-styles";
import { scoreQuiz, familyMix, type FamilyMember } from "./scoring";

describe("scoreQuiz — single top style", () => {
  test("5-0: all one answer resolves to that style", () => {
    const r = scoreQuiz(["A", "A", "A", "A", "A"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.isRojak).toBe(false);
    expect(r.display).toBe("Encouraging Words");
    expect(r.counts).toEqual({ sayang: 5, lepak: 0, help: 0, tapau: 0, hug: 0 });
  });

  test("4-1: clear leader, no hybrid", () => {
    const r = scoreQuiz(["A", "A", "A", "A", "B"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.display).toBe("Encouraging Words");
    expect(r.counts).toEqual({ sayang: 4, lepak: 1, help: 0, tapau: 0, hug: 0 });
  });

  test("3-2: leader of 3 wins outright, not a two-way hybrid", () => {
    const r = scoreQuiz(["A", "A", "A", "B", "B"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.isRojak).toBe(false);
    expect(r.display).toBe("Encouraging Words");
  });

  test("3-1-1: single top", () => {
    const r = scoreQuiz(["A", "A", "A", "B", "C"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.counts).toEqual({ sayang: 3, lepak: 1, help: 1, tapau: 0, hug: 0 });
  });

  test("2-1-1-1: single top of 2", () => {
    const r = scoreQuiz(["A", "A", "B", "C", "D"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.display).toBe("Encouraging Words");
    expect(r.counts).toEqual({ sayang: 2, lepak: 1, help: 1, tapau: 1, hug: 0 });
  });
});

describe("scoreQuiz — two-way tie (2+2+1), earliest-answered wins", () => {
  test("A answered before B → primary sayang, hybrid lepak", () => {
    const r = scoreQuiz(["A", "B", "A", "B", "C"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBe("lepak");
    expect(r.isRojak).toBe(false);
    expect(r.display).toBe("Encouraging Words, with a bit of Quality Time");
    expect(r.counts).toEqual({ sayang: 2, lepak: 2, help: 1, tapau: 0, hug: 0 });
  });

  test("B answered first flips the order → primary lepak, hybrid sayang", () => {
    const r = scoreQuiz(["B", "A", "B", "A", "C"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("lepak");
    expect(r.hybridWith).toBe("sayang");
    expect(r.display).toBe("Quality Time, with a bit of Encouraging Words");
  });

  test("later-letter styles tie: earliest-answered (C before E) leads", () => {
    const r = scoreQuiz(["C", "E", "C", "E", "A"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("help");
    expect(r.hybridWith).toBe("hug");
    expect(r.display).toBe("Helpful Actions, with a bit of Warm Touches");
  });

  test("hybridWith is the other tied style, not the canonically-first one", () => {
    const r = scoreQuiz(["E", "C", "E", "C", "A"] satisfies QuizAnswer[]);
    expect(r.primary).toBe("hug");
    expect(r.hybridWith).toBe("help");
    expect(r.display).toBe("Warm Touches, with a bit of Helpful Actions");
  });
});

describe("scoreQuiz — five-way tie (1×5) → Rojak Love", () => {
  test("A..E in order → Rojak, counted primary is earliest (sayang)", () => {
    const r = scoreQuiz(["A", "B", "C", "D", "E"] satisfies QuizAnswer[]);
    expect(r.isRojak).toBe(true);
    expect(r.display).toBe("Rojak Love");
    expect(r.primary).toBe("sayang");
    expect(r.hybridWith).toBeNull();
    expect(r.counts).toEqual({ sayang: 1, lepak: 1, help: 1, tapau: 1, hug: 1 });
  });

  test("reversed order → Rojak, counted primary follows earliest answer (hug)", () => {
    const r = scoreQuiz(["E", "D", "C", "B", "A"] satisfies QuizAnswer[]);
    expect(r.isRojak).toBe(true);
    expect(r.display).toBe("Rojak Love");
    expect(r.primary).toBe("hug");
    expect(r.hybridWith).toBeNull();
  });
});

describe("familyMix — N=2", () => {
  test("two styles, both parents → twoway", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "parent" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("twoway");
    expect(r.distinct).toBe(2);
    expect(r.counts).toEqual({ sayang: 1, lepak: 1, help: 0, tapau: 0, hug: 0 });
    expect(r.headline).toBe("Loves in two ways: Encouraging Words and Quality Time.");
    expect(r.dominantStyle).toBeUndefined();
    expect(r.contrast).toBeUndefined();
  });

  test("parent vs child, differing → contrast", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
    expect(r.contrast).toEqual({ parents: "sayang", children: "lepak" });
    expect(r.headline).toBe("Parents lean towards Encouraging Words; children lean towards Quality Time.");
  });

  test("same style → dominant even at N=2", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("dominant");
    expect(r.dominantStyle).toBe("sayang");
    expect(r.distinct).toBe(1);
    expect(r.headline).toBe("An Encouraging Words Family.");
  });
});

describe("familyMix — N=3", () => {
  test("majority (2 of 3, strict) → dominant", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "child" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("dominant");
    expect(r.dominantStyle).toBe("sayang");
  });

  test("three distinct, all parent-figures (no child group) → rojak", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "help", role: "grandparent" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("rojak");
    expect(r.distinct).toBe(3);
    expect(r.headline).toBe("A Rojak Love Family.");
  });
});

describe("familyMix — N=10", () => {
  test("clear majority (6/10) → dominant", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "child" },
      { primary: "sayang", role: "child" },
      { primary: "sayang", role: "child" },
      { primary: "sayang", role: "other" },
      { primary: "lepak", role: "child" },
      { primary: "lepak", role: "child" },
      { primary: "help", role: "guardian" },
      { primary: "help", role: "other" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("dominant");
    expect(r.dominantStyle).toBe("sayang");
    expect(r.counts).toEqual({ sayang: 6, lepak: 2, help: 2, tapau: 0, hug: 0 });
  });

  test("five distinct, no majority, no child group → rojak", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "help", role: "parent" },
      { primary: "help", role: "parent" },
      { primary: "tapau", role: "parent" },
      { primary: "hug", role: "parent" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("rojak");
    expect(r.distinct).toBe(5);
  });

  test("two styles split 5-5 → twoway", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "lepak", role: "parent" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("twoway");
    expect(r.distinct).toBe(2);
    expect(r.headline).toBe("Loves in two ways: Encouraging Words and Quality Time.");
  });
});

describe("familyMix — archetype precedence (first match wins)", () => {
  test("dominant beats contrast (majority present alongside a parent/child split)", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("dominant");
    expect(r.dominantStyle).toBe("sayang");
  });

  test("contrast beats rojak (3 distinct but parent/child lean differs)", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "lepak", role: "child" },
      { primary: "help", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
    expect(r.contrast).toEqual({ parents: "sayang", children: "lepak" });
  });

  test("contrast beats twoway (2 distinct but split across parent/child)", () => {
    const r = familyMix([
      { primary: "sayang", role: "grandparent" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
  });
});

describe("familyMix — role grouping", () => {
  test("'other' is neither parent-figure nor child → no contrast, falls to twoway", () => {
    const r = familyMix([
      { primary: "sayang", role: "other" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("twoway");
    expect(r.contrast).toBeUndefined();
  });

  test("'other' still counts toward the overall tally and dominant", () => {
    const r = familyMix([
      { primary: "sayang", role: "other" },
      { primary: "sayang", role: "other" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("dominant");
    expect(r.dominantStyle).toBe("sayang");
    expect(r.counts).toEqual({ sayang: 2, lepak: 1, help: 0, tapau: 0, hug: 0 });
  });

  test("guardian counts as a parent-figure → contrast", () => {
    const r = familyMix([
      { primary: "sayang", role: "guardian" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
    expect(r.contrast).toEqual({ parents: "sayang", children: "lepak" });
  });

  test("counts are by primary only, independent of role", () => {
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "sayang", role: "child" },
      { primary: "lepak", role: "guardian" },
      { primary: "lepak", role: "other" },
    ] satisfies FamilyMember[]);
    expect(r.counts).toEqual({ sayang: 2, lepak: 2, help: 0, tapau: 0, hug: 0 });
  });
});

describe("familyMix — contrast group-dominant tie-break (earliest-joined)", () => {
  test("children tie broken by join order, not canonical order", () => {
    // help (canonical idx 2) joins before lepak (canonical idx 1); join order wins.
    const r = familyMix([
      { primary: "sayang", role: "parent" },
      { primary: "help", role: "child" },
      { primary: "lepak", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
    expect(r.contrast).toEqual({ parents: "sayang", children: "help" });
  });

  test("parents tie broken by earliest-joined member", () => {
    const r = familyMix([
      { primary: "help", role: "parent" },
      { primary: "lepak", role: "parent" },
      { primary: "tapau", role: "child" },
    ] satisfies FamilyMember[]);
    expect(r.archetype).toBe("contrast");
    expect(r.contrast).toEqual({ parents: "help", children: "tapau" });
  });
});
