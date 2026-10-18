"""
FL Aggregation Algorithm Comparison
------------------------------------
Purpose:
    Compare FL aggregation algorithms in an isolated testing environment.

Algorithms:
    1. FedAvg
    2. FedProx

"""

import csv
from pathlib import Path


RESULTS_FILE = Path(__file__).parent / "results.csv"


def show_results():
    """Display the currently recorded comparison results."""

    if not RESULTS_FILE.exists():
        print("results.csv was not found.")
        return

    with open(RESULTS_FILE, "r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        print("\nFL AGGREGATION COMPARISON")
        print("=" * 70)

        for row in reader:
            print(f"\nAlgorithm : {row['algorithm']}")
            print(f"Samples   : {row['samples']}")
            print(f"MAE       : {row['mae'] or 'Not available'}")
            print(f"RMSE      : {row['rmse'] or 'Not available'}")
            print(f"R²        : {row['r2'] or 'Not available'}")
            print(f"Status    : {row['status']}")



def main():
    print("Isolated FL Aggregation Comparison")
    print("-----------------------------------")

    print("\nAlgorithms selected:")
    print("1. FedAvg")
    print("2. FedProx")

    print("\nNo production files are modified by this script.")

    show_results()


if __name__ == "__main__":
    main()