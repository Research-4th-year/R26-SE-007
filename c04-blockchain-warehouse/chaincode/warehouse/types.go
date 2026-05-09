package main

type StockEventAsset struct {
	AssetType     string  `json:"assetType"`
	ID            string  `json:"id"`
	WarehouseID   string  `json:"warehouseId"`
	EventType     string  `json:"eventType"`
	QuantityTons  float64 `json:"quantityTons"`
	DocumentHash  string  `json:"documentHash"`
	ReportedByID  string  `json:"reportedById"`
	ReportedByMSP string  `json:"reportedByMsp"`
	Timestamp     string  `json:"timestamp"`
	Notes         string  `json:"notes"`
}

type DisasterEventAsset struct {
	AssetType           string  `json:"assetType"`
	ID                  string  `json:"id"`
	DisasterType        string  `json:"disasterType"`
	AffectedWarehouseID string  `json:"affectedWarehouseId"`
	EstimatedLossTons   float64 `json:"estimatedLossTons"`
	Description         string  `json:"description"`
	ReportedByID        string  `json:"reportedById"`
	ReportedByMSP       string  `json:"reportedByMsp"`
	OccurredAt          string  `json:"occurredAt"`
	Timestamp           string  `json:"timestamp"`
}

type RedistributionOrderAsset struct {
	AssetType              string  `json:"assetType"`
	ID                     string  `json:"id"`
	DisasterEventID        string  `json:"disasterEventId"`
	SourceWarehouseID      string  `json:"sourceWarehouseId"`
	DestinationWarehouseID string  `json:"destinationWarehouseId"`
	QuantityTons           float64 `json:"quantityTons"`
	CompositeScore         float64 `json:"compositeScore"`
	IssuedByID             string  `json:"issuedById"`
	IssuedByMSP            string  `json:"issuedByMsp"`
	RMSignature            string  `json:"rmSignature"`
	Timestamp              string  `json:"timestamp"`
}

type ZKPProofAsset struct {
	AssetType          string `json:"assetType"`
	ID                 string `json:"id"`
	WarehouseID        string `json:"warehouseId"`
	DisasterEventID    string `json:"disasterEventId"`
	ProofHash          string `json:"proofHash"`
	PublicSignalsHash  string `json:"publicSignalsHash"`
	VerificationResult bool   `json:"verificationResult"`
	VerifiedByMSP      string `json:"verifiedByMsp"`
	Timestamp          string `json:"timestamp"`
}

type QueryResult struct {
	TxID      string      `json:"txId"`
	Timestamp string      `json:"timestamp"`
	Record    interface{} `json:"record"`
}