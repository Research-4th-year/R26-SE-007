package main

import (
	"log"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

func main() {
	warehouseChaincode, err := contractapi.NewChaincode(&WarehouseContract{})
	if err != nil {
		log.Panicf("Error creating warehouse chaincode: %v", err)
	}

	if err := warehouseChaincode.Start(); err != nil {
		log.Panicf("Error starting warehouse chaincode: %v", err)
	}
}