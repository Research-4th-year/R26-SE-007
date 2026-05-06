def statistical_checks(df):
    print("\n[STEP 9] Statistical Validation...")

    corr = df[['avg_price', 'production_total']].corr()

    print("✔ Correlation:")
    print(corr)

    return df