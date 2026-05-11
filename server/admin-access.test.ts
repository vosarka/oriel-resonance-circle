import { describe, expect, it } from "vitest";

import { appRouter } from "./routers";

describe("admin access boundaries", () => {
  it("blocks non-admin users from evaluating autonomy proposals", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 42,
        role: "user",
      },
    } as never);

    await expect(
      caller.oriel.autonomy.evaluate({ proposalId: 1 })
    ).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
  });
});
