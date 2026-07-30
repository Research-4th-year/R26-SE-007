import numpy as np

def estimate_confidence(shap_values):

        absolute = np.abs(shap_values)

        total = absolute.sum()

        if total == 0:
            return "Low"

        dominance = absolute.max() / total

        if dominance >= 0.60:
            return "High"

        elif dominance >= 0.35:
            return "Medium"

        else:
            return "Low"