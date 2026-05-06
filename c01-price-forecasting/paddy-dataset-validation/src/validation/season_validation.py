import pandas as pd

def validate_season(df):
    print("\n[STEP 7] Seasonal Validation...")

    def check_season(row):
        month = row['date'].month
        season = str(row['season']).strip().lower()

        if season == "yala":
            return month in [4, 5, 6, 7, 8]
        elif season == "maha":
            return month in [9, 10, 11, 12, 1, 2, 3]
        else:
            return False

    df['season_valid'] = df.apply(check_season, axis=1)

    invalid = df[~df['season_valid']]

    print(f"✔ Invalid season records: {len(invalid)}")

    if len(invalid) > 0:
        print("⚠ Sample invalid rows:")
        print(invalid[['date', 'district', 'season']].head())

    return df