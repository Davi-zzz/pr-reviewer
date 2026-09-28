import { computeSignals } from "./analyzers/shared/signals.ts";
import type { Analyzer } from "./core/analyzer.ts";
import type { Analysis, DiffStatEntry, PullRequest } from "./core/types.ts";

/** A small made-up PR (with a real bug) to test an analyzer without Bitbucket */
const pr: PullRequest = {
  key: "sample/payments-api#1",
  workspace: "sample",
  repo: "payments-api",
  id: 1,
  title: "Allow support agents to issue refunds",
  description: "Support asked to issue refunds without escalating to finance.",
  author: "Sample Author",
  url: "https://bitbucket.org/sample/payments-api/pull-requests/1",
  sourceBranch: "feat/agent-refunds",
  destBranch: "main",
  commit: "0000000",
  createdOn: new Date().toISOString(),
  updatedOn: new Date().toISOString(),
};

const diffStat: DiffStatEntry[] = [
  { path: "src/refunds/refund.controller.ts", status: "modified", linesAdded: 6, linesRemoved: 2 },
  { path: "src/refunds/refund.service.ts", status: "modified", linesAdded: 5, linesRemoved: 1 },
];

const diff = `diff --git a/src/refunds/refund.controller.ts b/src/refunds/refund.controller.ts
--- a/src/refunds/refund.controller.ts
+++ b/src/refunds/refund.controller.ts
@@ -10,8 +10,12 @@ export class RefundController {
   @Post(":paymentId/refund")
-  @Roles("finance")
+  @Roles("finance", "support")
   async refund(@Param("paymentId") paymentId: string, @Body() body: RefundDto, @User() user: AuthUser) {
-    return this.refunds.refund(paymentId, body.amount, user.id);
+    // support agents can refund any amount for now
+    return this.refunds.refund(paymentId, body.amount, user.id, { skipLimit: user.role === "support" });
   }
diff --git a/src/refunds/refund.service.ts b/src/refunds/refund.service.ts
--- a/src/refunds/refund.service.ts
+++ b/src/refunds/refund.service.ts
@@ -20,7 +20,11 @@ export class RefundService {
-  async refund(paymentId: string, amount: number, actorId: string) {
-    if (amount > MAX_REFUND_WITHOUT_APPROVAL) throw new ApprovalRequiredError();
+  async refund(paymentId: string, amount: number, actorId: string, opts: { skipLimit?: boolean } = {}) {
+    if (!opts.skipLimit && amount > MAX_REFUND_WITHOUT_APPROVAL) throw new ApprovalRequiredError();
     const payment = await this.payments.findOrFail(paymentId);
+    await this.audit.log("refund", { paymentId, amount, actorId });
     return this.gateway.refund(payment.gatewayId, amount);
   }
`;

export async function runSmoke(analyzer: Analyzer): Promise<Analysis> {
  const signals = computeSignals(pr, diffStat);
  return analyzer.analyze({ pr, diffStat, signals, getDiff: async () => diff });
}
