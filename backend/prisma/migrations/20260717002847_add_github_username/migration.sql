/*
  Warnings:

  - Added the required column `githubUsername` to the `Stake` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Stake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stakeId" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "githubUsername" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "shipped" BOOLEAN,
    "resolvedTxHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Stake" ("amountWei", "createdAt", "deadline", "id", "ownerAddress", "prNumber", "repo", "resolved", "resolvedTxHash", "shipped", "stakeId") SELECT "amountWei", "createdAt", "deadline", "id", "ownerAddress", "prNumber", "repo", "resolved", "resolvedTxHash", "shipped", "stakeId" FROM "Stake";
DROP TABLE "Stake";
ALTER TABLE "new_Stake" RENAME TO "Stake";
CREATE UNIQUE INDEX "Stake_stakeId_key" ON "Stake"("stakeId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
