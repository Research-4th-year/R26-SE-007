import numpy as np

def validate_features(df):
    print("\n[STEP 5] Feature Validation...")

    # mismatch = df[df['price_range'] != (df['max_price'] - df['min_price'])]
    
    # Use tolerance comparison
    mismatch = df[
        ~np.isclose(
            df['price_range'],
            df['max_price'] - df['min_price'],
            atol=1e-2   # tolerance (0.01)
        )
    ]

    print(f"✔ price_range mismatches: {len(mismatch)}")

    if len(mismatch) > 0:
        print("\n🔍 Sample mismatches:")
        print(mismatch[['date','district','price_range','min_price','max_price']].head(10))

        mismatch.to_csv("reports/price_range_mismatch.csv", index=False)
        print("✔ Saved → reports/price_range_mismatch.csv")

    return df

def validate_lag_features(df):
    print("\n[STEP 5.1] Lag Feature Validation...")

    df = df.sort_values(by=['district', 'paddy_type', 'date'])

    df['expected_lag1'] = df.groupby(['district','paddy_type'])['avg_price'].shift(1)

    lag_issues = df[df['price_t-1'] != df['expected_lag1']]

    print(f"✔ Lag feature issues: {len(lag_issues)}")

    if len(lag_issues) > 0:
        print("\n🔍 Sample lag issues:")
        print(lag_issues[['date','district','avg_price','price_t-1','expected_lag1']].head(10))

        lag_issues.to_csv("reports/lag_feature_issues.csv", index=False)
        print("✔ Saved → reports/lag_feature_issues.csv")

    return df