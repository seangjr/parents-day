import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import testingServer from "next/experimental/testing/server";
import { NextRequest } from "next/server";
import { config, proxy } from "./proxy";

const TEST_ENV = process.env as Record<string, string | undefined>;
const ORIGINAL_PIN = process.env.ADMIN_PIN;
const ORIGINAL_NODE_ENV = process.env.NODE_ENV;
const PIN = "482731";
const doesProxyMatch = testingServer.unstable_doesMiddlewareMatch;

beforeEach(() => {
  TEST_ENV.ADMIN_PIN = PIN;
  TEST_ENV.NODE_ENV = "production";
});

afterEach(() => {
  TEST_ENV.ADMIN_PIN = ORIGINAL_PIN;
  TEST_ENV.NODE_ENV = ORIGINAL_NODE_ENV;
});

describe("admin and LED route protection", () => {
  test("proxy matcher covers pages and every private API", () => {
    for (const url of [
      "/admin",
      "/admin/operators",
      "/led",
      "/led/display",
      "/api/admin/state",
      "/api/led-state",
      "/api/led-background",
    ]) {
      expect(
        doesProxyMatch({ config, nextConfig: {}, url }),
      ).toBe(true);
    }

    expect(
      doesProxyMatch({ config, nextConfig: {}, url: "/quiz" }),
    ).toBe(false);
  });

  test("requests without a PIN cookie are denied on admin and LED surfaces", async () => {
    for (const path of [
      "/admin",
      "/api/admin/state",
      "/led",
      "/api/led-state",
      "/api/led-background",
    ]) {
      const response = await proxy(
        new NextRequest(`https://example.test${path}`),
      );
      expect(response.status).toBe(401);
    }
  });

  test("production fails closed when ADMIN_PIN is missing or malformed", async () => {
    delete TEST_ENV.ADMIN_PIN;
    expect(
      (await proxy(new NextRequest("https://example.test/admin"))).status,
    ).toBe(401);
    expect(
      (await proxy(new NextRequest("https://example.test/led"))).status,
    ).toBe(401);

    TEST_ENV.ADMIN_PIN = "not-six-digits";
    expect(
      (await proxy(new NextRequest("https://example.test/admin"))).status,
    ).toBe(401);
  });

  test("an incorrect PIN returns an accessible inline error", async () => {
    const response = await proxy(
      new NextRequest("https://example.test/admin", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ pin: "111111" }),
      }),
    );
    const html = await response.text();

    expect(response.status).toBe(401);
    expect(html).toContain("That PIN didn’t match");
    expect(html).toContain('aria-invalid="true"');
  });

  test("a valid PIN becomes an httpOnly cookie and redirects without a URL credential", async () => {
    const response = await proxy(
      new NextRequest("https://example.test/led", {
        method: "POST",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ pin: PIN }),
      }),
    );
    const cookie = response.headers.get("set-cookie") ?? "";

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.test/led");
    expect(cookie).toContain(`pd_access=${PIN}`);
    expect(cookie.toLowerCase()).toContain("httponly");
    expect(cookie.toLowerCase()).toContain("samesite=lax");
    expect(cookie.toLowerCase()).toContain("secure");
  });

  test("a valid cookie authorizes the protected LED API", async () => {
    const request = new NextRequest("https://example.test/api/led-state", {
      headers: { cookie: `pd_access=${PIN}` },
    });
    const response = await proxy(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });
});
