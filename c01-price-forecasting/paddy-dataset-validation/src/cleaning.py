import pandas as pd

def clean_data(df):
    print("\n[STEP 2] Cleaning Data...")

    df['date'] = pd.to_datetime(df['date'], errors='coerce')

    df = df.sort_values(by=['district', 'paddy_type', 'date'])

    print(" Data sorted correctly for lag validation")

    return df