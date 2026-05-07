import pandas as pd
import random

districts = ["Ampara", "Kandy", "Badulla", "Monaragala"]
paddy_types = ["Nadu", "Samba", "Keeri Samba"]
seasons = ["Maha", "Yala"]

data = []

for i in range(1000):

    district = random.choice(districts)
    paddy = random.choice(paddy_types)
    season = random.choice(seasons)

    quantity = random.randint(500, 5000)

    # BASE PRICE
    price = 100

    # Paddy type effect
    if paddy == "Samba":
        price += 20
    elif paddy == "Keeri Samba":
        price += 30

    # Season effect
    if season == "Maha":
        price += 10

    # District effect
    if district == "Ampara":
        price += 5
    elif district == "Kandy":
        price += 3
    elif district == "Badulla":
        price += 1
    elif district == "Monaragala":
        price += 2    

    # Random noise
    price += random.randint(-5, 5)

    data.append({
        "district": district,
        "paddyType": paddy,
        "season": season,
        "quantity": quantity,
        "price": price
    })

df = pd.DataFrame(data)

df.to_csv("paddy_dataset.csv", index=False)

print("Dataset Generated Successfully")