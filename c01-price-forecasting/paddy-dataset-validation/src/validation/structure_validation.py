def validate_structure(df):
    print("\n[STEP 1] Structure Validation...")

    # Remove unwanted column
    if 'Unnamed: 8' in df.columns:
        df = df.drop(columns=['Unnamed: 8'])
        print("✔ Removed unwanted column: Unnamed: 8")

    print(f"✔ Columns: {list(df.columns)}")
    print(f"✔ Shape: {df.shape}")

    return df