def generate_summary(result):

        return (

            f"The model predicts an average paddy price of "
            f"{result['prediction']:.2f} LKR/kg. "

            f"The expected market trend is "

            f"'{result['trend']}'. "

            f"The explanation is supported with "

            f"{result['confidence'].lower()} confidence."

        )