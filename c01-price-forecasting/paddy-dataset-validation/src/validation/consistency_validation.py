def validate_prices(df):
    print("\n[STEP 4] Price Consistency Check...")

    invalid = df[
        (df['min_price'] > df['avg_price']) |
        (df['avg_price'] > df['max_price'])
    ]

    print(f" Invalid price records: {len(invalid)}")

    if len(invalid) > 0:
        print("\n Sample invalid price rows:")
        print(invalid[['date','district','min_price','avg_price','max_price']].head(10))

        # Save for analysis
        invalid.to_csv("reports/invalid_price_records.csv", index=False)
        print(" Saved → reports/invalid_price_records.csv")

    return df