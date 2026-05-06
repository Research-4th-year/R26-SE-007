def check_missing(df):
    print("\n[STEP 3] Missing Value Analysis...")

    missing = df.isnull().sum()
    missing = missing[missing > 0]

    for col, val in missing.items():
        percent = (val / len(df)) * 100

        # Explain expected NaN
        if "price_t-" in col or "avg" in col:
            print(f"✔ {col}: {val} ({percent:.2f}%) → Expected (lag/rolling)")
        else:
            print(f"⚠ {col}: {val} ({percent:.2f}%) → Check")

    return df