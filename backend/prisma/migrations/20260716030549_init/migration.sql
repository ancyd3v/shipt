-- CreateTable
CREATE TABLE "Stake" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "stakeId" INTEGER NOT NULL,
    "ownerAddress" TEXT NOT NULL,
    "amountWei" TEXT NOT NULL,
    "repo" TEXT NOT NULL,
    "prNumber" INTEGER NOT NULL,
    "deadline" DATETIME NOT NULL,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "shipped" BOOLEAN,
    "resolvedTxHash" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE UNIQUE INDEX "Stake_stakeId_key" ON "Stake"("stakeId");
