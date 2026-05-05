-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `role` ENUM('ADMIN', 'REGIONAL_MANAGER', 'WAREHOUSE_SUPERVISOR', 'AUDITOR') NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `fabricEnrollmentId` VARCHAR(191) NULL,
    `fabricMspId` VARCHAR(191) NULL,
    `warehouseId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    UNIQUE INDEX `users_fabricEnrollmentId_key`(`fabricEnrollmentId`),
    INDEX `users_email_idx`(`email`),
    INDEX `users_role_idx`(`role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refresh_tokens` (
    `id` VARCHAR(191) NOT NULL,
    `token` VARCHAR(512) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `refresh_tokens_token_key`(`token`),
    INDEX `refresh_tokens_token_idx`(`token`),
    INDEX `refresh_tokens_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouses` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `address` VARCHAR(191) NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `capacityTons` DOUBLE NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `fabricPeerId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `warehouses_code_key`(`code`),
    INDEX `warehouses_district_idx`(`district`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_events` (
    `id` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `eventType` ENUM('INFLOW', 'OUTFLOW', 'REDISTRIBUTION', 'DAMAGE', 'ADJUSTMENT') NOT NULL,
    `quantityTons` DOUBLE NOT NULL,
    `notes` TEXT NULL,
    `documentHash` VARCHAR(191) NULL,
    `documentPath` VARCHAR(191) NULL,
    `blockchainTxId` VARCHAR(191) NULL,
    `reportedById` VARCHAR(191) NOT NULL,
    `timestamp` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `stock_events_blockchainTxId_key`(`blockchainTxId`),
    INDEX `stock_events_warehouseId_idx`(`warehouseId`),
    INDEX `stock_events_eventType_idx`(`eventType`),
    INDEX `stock_events_timestamp_idx`(`timestamp`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `disaster_events` (
    `id` VARCHAR(191) NOT NULL,
    `disasterType` ENUM('FLOOD', 'CYCLONE', 'ELEPHANT_ATTACK', 'FIRE', 'OTHER') NOT NULL,
    `description` TEXT NULL,
    `estimatedLossTons` DOUBLE NULL,
    `status` ENUM('OPEN', 'IN_PROGRESS', 'RESOLVED') NOT NULL DEFAULT 'OPEN',
    `affectedWarehouseId` VARCHAR(191) NOT NULL,
    `reportedById` VARCHAR(191) NOT NULL,
    `blockchainTxId` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `disaster_events_blockchainTxId_key`(`blockchainTxId`),
    INDEX `disaster_events_status_idx`(`status`),
    INDEX `disaster_events_affectedWarehouseId_idx`(`affectedWarehouseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `redistribution_orders` (
    `id` VARCHAR(191) NOT NULL,
    `disasterEventId` VARCHAR(191) NOT NULL,
    `sourceWarehouseId` VARCHAR(191) NOT NULL,
    `destinationWarehouseId` VARCHAR(191) NOT NULL,
    `quantityTons` DOUBLE NOT NULL,
    `compositeScore` DOUBLE NULL,
    `rmSignature` TEXT NULL,
    `blockchainTxId` VARCHAR(191) NULL,
    `issuedById` VARCHAR(191) NOT NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `redistribution_orders_blockchainTxId_key`(`blockchainTxId`),
    INDEX `redistribution_orders_disasterEventId_idx`(`disasterEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `zkp_proofs` (
    `id` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `disasterEventId` VARCHAR(191) NOT NULL,
    `proofJson` JSON NOT NULL,
    `publicSignals` JSON NOT NULL,
    `verificationResult` BOOLEAN NULL,
    `blockchainTxId` VARCHAR(191) NULL,
    `submittedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `verifiedAt` DATETIME(3) NULL,

    UNIQUE INDEX `zkp_proofs_blockchainTxId_key`(`blockchainTxId`),
    INDEX `zkp_proofs_warehouseId_idx`(`warehouseId`),
    INDEX `zkp_proofs_disasterEventId_idx`(`disasterEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `warehouse_scores` (
    `id` VARCHAR(191) NOT NULL,
    `warehouseId` VARCHAR(191) NOT NULL,
    `reliabilityScore` DOUBLE NOT NULL,
    `anomalyFlags` JSON NULL,
    `computedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `warehouse_scores_warehouseId_idx`(`warehouseId`),
    INDEX `warehouse_scores_computedAt_idx`(`computedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `users` ADD CONSTRAINT `users_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refresh_tokens` ADD CONSTRAINT `refresh_tokens_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_events` ADD CONSTRAINT `stock_events_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `stock_events` ADD CONSTRAINT `stock_events_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disaster_events` ADD CONSTRAINT `disaster_events_affectedWarehouseId_fkey` FOREIGN KEY (`affectedWarehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `disaster_events` ADD CONSTRAINT `disaster_events_reportedById_fkey` FOREIGN KEY (`reportedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redistribution_orders` ADD CONSTRAINT `redistribution_orders_disasterEventId_fkey` FOREIGN KEY (`disasterEventId`) REFERENCES `disaster_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redistribution_orders` ADD CONSTRAINT `redistribution_orders_sourceWarehouseId_fkey` FOREIGN KEY (`sourceWarehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redistribution_orders` ADD CONSTRAINT `redistribution_orders_destinationWarehouseId_fkey` FOREIGN KEY (`destinationWarehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `redistribution_orders` ADD CONSTRAINT `redistribution_orders_issuedById_fkey` FOREIGN KEY (`issuedById`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `zkp_proofs` ADD CONSTRAINT `zkp_proofs_disasterEventId_fkey` FOREIGN KEY (`disasterEventId`) REFERENCES `disaster_events`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `warehouse_scores` ADD CONSTRAINT `warehouse_scores_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `warehouses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
