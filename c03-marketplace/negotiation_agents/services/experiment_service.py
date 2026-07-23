import csv
import json
from pathlib import Path
from statistics import mean

from schemas.experiment import ExperimentSummary
from schemas.negotiation import NegotiationStatus
from schemas.negotiation_metrics import (
    NegotiationMetrics,
)
from services.negotiation_orchestrator import (
    NegotiationOrchestrator,
)
from services.scenario_generator import (
    ScenarioGenerator,
)


class ExperimentService:
    def __init__(
        self,
        orchestrator: NegotiationOrchestrator,
        output_directory: str = "experiment_results",
        seed: int | None = 42,
    ) -> None:
        self.orchestrator = orchestrator
        self.generator = ScenarioGenerator(
            seed=seed
        )

        self.output_directory = Path(
            output_directory
        )

        self.output_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    def run(
        self,
        number_of_negotiations: int,
    ) -> tuple[
        list[NegotiationMetrics],
        ExperimentSummary,
    ]:
        if number_of_negotiations <= 0:
            raise ValueError(
                "number_of_negotiations must be "
                "greater than zero."
            )

        metrics_list: list[
            NegotiationMetrics
        ] = []

        for index in range(
            1,
            number_of_negotiations + 1,
        ):
            print(
                "\n"
                f"Running experiment "
                f"{index}/{number_of_negotiations}"
            )

            request = self.generator.generate(
                negotiation_number=index
            )

            try:
                result = self.orchestrator.negotiate(
                    request
                )

                metrics = (
                    NegotiationMetrics.from_result(
                        result
                    )
                )

                metrics_list.append(metrics)

            except Exception as error:
                print(
                    f"Experiment {index} failed: "
                    f"{error}"
                )

        summary = self._calculate_summary(
            metrics_list
        )

        self._export_metrics_csv(metrics_list)
        self._export_summary_json(summary)

        return metrics_list, summary

    def _calculate_summary(
        self,
        metrics_list: list[
            NegotiationMetrics
        ],
    ) -> ExperimentSummary:
        total = len(metrics_list)

        if total == 0:
            raise ValueError(
                "No experiment results were produced."
            )

        agreements = sum(
            metric.agreement_reached
            for metric in metrics_list
        )

        deadlocks = sum(
            metric.deadlock_detected
            for metric in metrics_list
        )

        rejections = sum(
            metric.rejected
            for metric in metrics_list
        )

        validation_failures = sum(
            metric.validation_failed
            for metric in metrics_list
        )

        maximum_round_failures = sum(
            metric.status
            == NegotiationStatus
            .MAX_ROUNDS_REACHED.value
            for metric in metrics_list
        )

        agreed_metrics = [
            metric
            for metric in metrics_list
            if metric.agreement_reached
        ]

        fairness_scores = [
            metric.fairness_score
            for metric in agreed_metrics
            if metric.fairness_score is not None
        ]

        agreed_prices = [
            metric.agreed_price
            for metric in agreed_metrics
            if metric.agreed_price is not None
        ]

        price_differences = [
            metric.price_difference_from_reference
            for metric in agreed_metrics
            if (
                metric
                .price_difference_from_reference
                is not None
            )
        ]

        return ExperimentSummary(
            total_negotiations=total,

            agreements=agreements,
            deadlocks=deadlocks,
            rejections=rejections,
            validation_failures=(
                validation_failures
            ),
            maximum_round_failures=(
                maximum_round_failures
            ),

            agreement_rate=round(
                agreements / total * 100,
                2,
            ),
            deadlock_rate=round(
                deadlocks / total * 100,
                2,
            ),
            rejection_rate=round(
                rejections / total * 100,
                2,
            ),
            validation_failure_rate=round(
                validation_failures
                / total
                * 100,
                2,
            ),

            average_rounds=round(
                mean(
                    metric.rounds_completed
                    for metric in metrics_list
                ),
                2,
            ),

            average_agreed_price=(
                round(mean(agreed_prices), 2)
                if agreed_prices
                else None
            ),

            average_fairness_score=(
                round(mean(fairness_scores), 2)
                if fairness_scores
                else None
            ),

            average_price_difference=(
                round(
                    mean(price_differences),
                    2,
                )
                if price_differences
                else None
            ),

            minimum_fairness_score=(
                round(min(fairness_scores), 2)
                if fairness_scores
                else None
            ),

            maximum_fairness_score=(
                round(max(fairness_scores), 2)
                if fairness_scores
                else None
            ),
        )

    def _export_metrics_csv(
        self,
        metrics_list: list[
            NegotiationMetrics
        ],
    ) -> None:
        file_path = (
            self.output_directory
            / "negotiation_results.csv"
        )

        if not metrics_list:
            return

        with file_path.open(
            "w",
            newline="",
            encoding="utf-8",
        ) as file:
            writer = csv.DictWriter(
                file,
                fieldnames=list(
                    metrics_list[0]
                    .to_dict()
                    .keys()
                ),
            )

            writer.writeheader()

            for metric in metrics_list:
                writer.writerow(
                    metric.to_dict()
                )

        print(
            f"CSV results saved to: {file_path}"
        )

    def _export_summary_json(
        self,
        summary: ExperimentSummary,
    ) -> None:
        file_path = (
            self.output_directory
            / "experiment_summary.json"
        )

        with file_path.open(
            "w",
            encoding="utf-8",
        ) as file:
            json.dump(
                summary.to_dict(),
                file,
                indent=2,
            )

        print(
            f"Experiment summary saved to: "
            f"{file_path}"
        )