import pandas as pd
from sklearn.preprocessing import LabelEncoder

def load_and_preprocess(path):

    df = pd.read_csv(path)

    le_district = LabelEncoder()
    le_paddy = LabelEncoder()
    le_season = LabelEncoder()

    df['district'] = le_district.fit_transform(df['district'])
    df['paddyType'] = le_paddy.fit_transform(df['paddyType'])
    df['season'] = le_season.fit_transform(df['season'])

    X = df[['district', 'paddyType', 'season', 'quantity']]
    y = df['price']

    return X, y