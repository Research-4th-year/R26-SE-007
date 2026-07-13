package main

import (
	"crypto/sha256"
	"encoding/json"
	"fmt"
	"time"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

type WarehouseContract struct {
	contractapi.Contract
}

func (s *WarehouseContract) RecordStockEvent(
	ctx contractapi.TransactionContextInterface,
	id string,
	warehouseID string,
	eventType string,
	quantityTons float64,
	documentHash string,
	reportedByID string,
	notes string,
) error {
	exists, err := s.assetExists(ctx, "SE_"+id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("stock event %s already recorded on ledger", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	asset := StockEventAsset{
		AssetType:     "STOCK_EVENT",
		ID:            id,
		WarehouseID:   warehouseID,
		EventType:     eventType,
		QuantityTons:  quantityTons,
		DocumentHash:  documentHash,
		ReportedByID:  reportedByID,
		ReportedByMSP: mspID,
		Timestamp:     s.getTxTimestamp(ctx),
		Notes:         notes,
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("SE_"+id, assetJSON)
}

func (s *WarehouseContract) RecordDisasterEvent(
	ctx contractapi.TransactionContextInterface,
	id string,
	disasterType string,
	affectedWarehouseID string,
	estimatedLossTons float64,
	description string,
	reportedByID string,
	occurredAt string,
) error {
	exists, err := s.assetExists(ctx, "DE_"+id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("disaster event %s already recorded on ledger", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	asset := DisasterEventAsset{
		AssetType:           "DISASTER_EVENT",
		ID:                  id,
		DisasterType:        disasterType,
		AffectedWarehouseID: affectedWarehouseID,
		EstimatedLossTons:   estimatedLossTons,
		Description:         description,
		ReportedByID:        reportedByID,
		ReportedByMSP:       mspID,
		OccurredAt:          occurredAt,
		Timestamp:           s.getTxTimestamp(ctx),
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("DE_"+id, assetJSON)
}

func (s *WarehouseContract) IssueRedistributionOrder(
	ctx contractapi.TransactionContextInterface,
	id string,
	disasterEventID string,
	sourceWarehouseID string,
	destinationWarehouseID string,
	quantityTons float64,
	compositeScore float64,
	issuedByID string,
) error {
	exists, err := s.assetExists(ctx, "RO_"+id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("redistribution order %s already recorded on ledger", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	sigData := fmt.Sprintf("%s:%s:%s:%s:%.2f:%.4f",
		id, disasterEventID, sourceWarehouseID,
		destinationWarehouseID, quantityTons, compositeScore,
	)
	rmSignature := fmt.Sprintf("%x", sha256.Sum256([]byte(sigData)))

	asset := RedistributionOrderAsset{
		AssetType:              "REDISTRIBUTION_ORDER",
		ID:                     id,
		DisasterEventID:        disasterEventID,
		SourceWarehouseID:      sourceWarehouseID,
		DestinationWarehouseID: destinationWarehouseID,
		QuantityTons:           quantityTons,
		CompositeScore:         compositeScore,
		IssuedByID:             issuedByID,
		IssuedByMSP:            mspID,
		RMSignature:            rmSignature,
		Timestamp:              s.getTxTimestamp(ctx),
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("RO_"+id, assetJSON)
}

func (s *WarehouseContract) RecordZKPVerification(
	ctx contractapi.TransactionContextInterface,
	id string,
	warehouseID string,
	disasterEventID string,
	proofJSON string,
	publicSignalsJSON string,
	verificationResult bool,
) error {
	exists, err := s.assetExists(ctx, "ZKP_"+id)
	if err != nil {
		return err
	}
	if exists {
		return fmt.Errorf("ZKP proof %s already recorded on ledger", id)
	}

	mspID, err := ctx.GetClientIdentity().GetMSPID()
	if err != nil {
		return fmt.Errorf("failed to get MSP ID: %v", err)
	}

	proofHash    := fmt.Sprintf("%x", sha256.Sum256([]byte(proofJSON)))
	signalsHash  := fmt.Sprintf("%x", sha256.Sum256([]byte(publicSignalsJSON)))

	asset := ZKPProofAsset{
		AssetType:          "ZKP_PROOF",
		ID:                 id,
		WarehouseID:        warehouseID,
		DisasterEventID:    disasterEventID,
		ProofHash:          proofHash,
		PublicSignalsHash:  signalsHash,
		VerificationResult: verificationResult,
		VerifiedByMSP:      mspID,
		Timestamp:          s.getTxTimestamp(ctx),
	}

	assetJSON, err := json.Marshal(asset)
	if err != nil {
		return err
	}

	return ctx.GetStub().PutState("ZKP_"+id, assetJSON)
}

func (s *WarehouseContract) QueryStockEvent(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*StockEventAsset, error) {
	data, err := ctx.GetStub().GetState("SE_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read stock event: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("stock event %s not found on ledger", id)
	}
	var asset StockEventAsset
	if err := json.Unmarshal(data, &asset); err != nil {
		return nil, err
	}
	return &asset, nil
}

func (s *WarehouseContract) QueryDisasterEvent(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*DisasterEventAsset, error) {
	data, err := ctx.GetStub().GetState("DE_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read disaster event: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("disaster event %s not found on ledger", id)
	}
	var asset DisasterEventAsset
	if err := json.Unmarshal(data, &asset); err != nil {
		return nil, err
	}
	return &asset, nil
}

func (s *WarehouseContract) QueryRedistributionOrder(
	ctx contractapi.TransactionContextInterface,
	id string,
) (*RedistributionOrderAsset, error) {
	data, err := ctx.GetStub().GetState("RO_" + id)
	if err != nil {
		return nil, fmt.Errorf("failed to read redistribution order: %v", err)
	}
	if data == nil {
		return nil, fmt.Errorf("redistribution order %s not found on ledger", id)
	}
	var asset RedistributionOrderAsset
	if err := json.Unmarshal(data, &asset); err != nil {
		return nil, err
	}
	return &asset, nil
}

func (s *WarehouseContract) QueryWarehouseHistory(
	ctx contractapi.TransactionContextInterface,
	warehouseID string,
) ([]*StockEventAsset, error) {
	query := fmt.Sprintf(`{"selector":{"assetType":"STOCK_EVENT","warehouseId":"%s"}}`, warehouseID)

	iterator, err := ctx.GetStub().GetQueryResult(query)
	if err != nil {
		return nil, fmt.Errorf("failed to query warehouse history: %v", err)
	}
	defer iterator.Close()

	var results []*StockEventAsset
	for iterator.HasNext() {
		item, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		var asset StockEventAsset
		if err := json.Unmarshal(item.Value, &asset); err != nil {
			return nil, err
		}
		results = append(results, &asset)
	}
	return results, nil
}

func (s *WarehouseContract) QueryDisasterAuditTrail(
	ctx contractapi.TransactionContextInterface,
	disasterID string,
) (map[string]interface{}, error) {
	disasterData, err := ctx.GetStub().GetState("DE_" + disasterID)
	if err != nil {
		return nil, err
	}

	var disaster DisasterEventAsset
	if disasterData != nil {
		json.Unmarshal(disasterData, &disaster)
	}

	roQuery := fmt.Sprintf(`{"selector":{"assetType":"REDISTRIBUTION_ORDER","disasterEventId":"%s"}}`, disasterID)
	roIterator, err := ctx.GetStub().GetQueryResult(roQuery)
	if err != nil {
		return nil, err
	}
	defer roIterator.Close()

	var orders []*RedistributionOrderAsset
	for roIterator.HasNext() {
		item, _ := roIterator.Next()
		var asset RedistributionOrderAsset
		json.Unmarshal(item.Value, &asset)
		orders = append(orders, &asset)
	}

	zkpQuery := fmt.Sprintf(`{"selector":{"assetType":"ZKP_PROOF","disasterEventId":"%s"}}`, disasterID)
	zkpIterator, err := ctx.GetStub().GetQueryResult(zkpQuery)
	if err != nil {
		return nil, err
	}
	defer zkpIterator.Close()

	var proofs []*ZKPProofAsset
	for zkpIterator.HasNext() {
		item, _ := zkpIterator.Next()
		var asset ZKPProofAsset
		json.Unmarshal(item.Value, &asset)
		proofs = append(proofs, &asset)
	}

	return map[string]interface{}{
		"disaster":             disaster,
		"redistributionOrders": orders,
		"zkpProofs":            proofs,
	}, nil
}

// getTxTimestamp uses the Fabric transaction timestamp — deterministic
// across all peers, unlike time.Now() which caused endorsement mismatches.
func (s *WarehouseContract) getTxTimestamp(ctx contractapi.TransactionContextInterface) string {
	txTime, err := ctx.GetStub().GetTxTimestamp()
	if err != nil {
		return time.Now().UTC().Format(time.RFC3339)
	}
	return time.Unix(txTime.Seconds, int64(txTime.Nanos)).UTC().Format(time.RFC3339)
}

func (s *WarehouseContract) assetExists(
	ctx contractapi.TransactionContextInterface,
	key string,
) (bool, error) {
	data, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, err
	}
	return data != nil, nil
}