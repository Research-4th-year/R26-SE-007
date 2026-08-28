from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


RESULT_DIRECTORY = Path(
    "experiment_results"
)

CSV_PATH = (
    RESULT_DIRECTORY
    / "negotiation_results.csv"
)

CHART_DIRECTORY = (
    RESULT_DIRECTORY
    / "charts"
)


def create_outcome_chart(
    data: pd.DataFrame,
) -> None:
    outcome_counts = (
        data["status"]
        .value_counts()
        .sort_index()
    )

    plt.figure(figsize=(8, 5))
    outcome_counts.plot(kind="bar")

    plt.title("Negotiation Outcomes")
    plt.xlabel("Outcome")
    plt.ylabel("Number of Negotiations")
    plt.xticks(rotation=30)
    plt.tight_layout()

    plt.savefig(
        CHART_DIRECTORY
        / "negotiation_outcomes.png",
        dpi=300,
    )

    plt.close()


def create_rounds_chart(
    data: pd.DataFrame,
) -> None:
    plt.figure(figsize=(8, 5))

    data["rounds_completed"].plot(
        kind="hist",
        bins=range(
            1,
            int(
                data["rounds_completed"].max()
            )
            + 2,
        ),
    )

    plt.title(
        "Distribution of Negotiation Rounds"
    )
    plt.xlabel("Rounds Completed")
    plt.ylabel("Frequency")
    plt.tight_layout()

    plt.savefig(
        CHART_DIRECTORY
        / "rounds_distribution.png",
        dpi=300,
    )

    plt.close()


def create_fairness_chart(
    data: pd.DataFrame,
) -> None:
    fairness_data = (
        data["fairness_score"]
        .dropna()
    )

    if fairness_data.empty:
        return

    plt.figure(figsize=(8, 5))

    fairness_data.plot(
        kind="hist",
        bins=10,
    )

    plt.title(
        "Distribution of Fairness Scores"
    )
    plt.xlabel("Fairness Score")
    plt.ylabel("Frequency")
    plt.tight_layout()

    plt.savefig(
        CHART_DIRECTORY
        / "fairness_distribution.png",
        dpi=300,
    )

    plt.close()


def create_price_difference_chart(
    data: pd.DataFrame,
) -> None:
    price_data = (
        data[
            "price_difference_from_reference"
        ]
        .dropna()
    )

    if price_data.empty:
        return

    plt.figure(figsize=(8, 5))

    price_data.plot(
        kind="hist",
        bins=10,
    )

    plt.title(
        "Agreement Price Difference "
        "from FL Reference"
    )
    plt.xlabel(
        "Absolute Price Difference (LKR)"
    )
    plt.ylabel("Frequency")
    plt.tight_layout()

    plt.savefig(
        CHART_DIRECTORY
        / "price_difference_distribution.png",
        dpi=300,
    )

    plt.close()


def main() -> None:
    if not CSV_PATH.exists():
        raise FileNotFoundError(
            f"Results file not found: {CSV_PATH}"
        )

    CHART_DIRECTORY.mkdir(
        parents=True,
        exist_ok=True,
    )

    data = pd.read_csv(CSV_PATH)

    create_outcome_chart(data)
    create_rounds_chart(data)
    create_fairness_chart(data)
    create_price_difference_chart(data)

    print(
        f"Charts saved to: {CHART_DIRECTORY}"
    )


if __name__ == "__main__":
    main()