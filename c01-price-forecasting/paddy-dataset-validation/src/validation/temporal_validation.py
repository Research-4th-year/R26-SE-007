import pandas as pd

def validate_temporal(df):
    print("\n[STEP 6] Temporal Validation...")

    all_missing = []

    for district in df['district'].unique():
        temp = df[df['district'] == district]

        expected = pd.date_range(
            temp['date'].min(),
            temp['date'].max(),
            freq='W-THU'  # IMPORTANT - weekly Thursday
        )

        actual = temp['date']

        missing = sorted(list(set(expected) - set(actual)))

        print(f"   {district}: {len(missing)} missing weeks")

        # Save per district
        if len(missing) > 0:
            temp_df = pd.DataFrame({
                'district': district,
                'missing_date': missing
            })

            temp_df.to_csv(f"reports/missing_weeks_{district}.csv", index=False)
            print(f" Saved → reports/missing_weeks_{district}.csv")

        all_missing.extend(missing)

    print(f" Total missing time points: {len(all_missing)}")

    return df