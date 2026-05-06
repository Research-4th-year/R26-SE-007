def detect_outliers(df):
    print("\n[STEP 8] Outlier Detection...")

    Q1 = df['avg_price'].quantile(0.25)
    Q3 = df['avg_price'].quantile(0.75)
    IQR = Q3 - Q1

    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR

    outliers = df[(df['avg_price'] < lower) | (df['avg_price'] > upper)]

    print(f"✔ Outliers detected: {len(outliers)}")

    return df