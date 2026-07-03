import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";

describe("Signature Letter router access", () => {
  it("requires authentication before creating checkout", async () => {
    const caller = appRouter.createCaller({ user: null } as never);

    await expect(
      caller.signature.createCheckout({ productType: "glimpse" })
    ).rejects.toMatchObject({
      code: "UNAUTHORIZED",
    });
  });

  it("blocks non-admin users from Signature Letter admin workflow", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 42,
        role: "user",
      },
    } as never);

    await expect(
      caller.admin.signatureLetters.listOrders()
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
