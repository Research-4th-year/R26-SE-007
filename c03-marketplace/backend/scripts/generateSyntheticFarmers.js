const fs = require("fs");
const path = require("path");

const OUTPUT_PATH =
  path.resolve(
    __dirname,
    "../../data/farmers_synthetic.csv"
  );

const TOTAL_FARMERS = 120;

const FIRST_NAMES = [
  "Nimal",
  "Sunil",
  "Kamal",
  "Saman",
  "Ajith",
  "Ruwan",
  "Chamara",
  "Pradeep",
  "Mahesh",
  "Lalith",
  "Dinesh",
  "Roshan",
  "Kasun",
  "Tharindu",
  "Janaka",
  "Priyantha",
  "Upul",
  "Asanka",
  "Indika",
  "Gayan",
];

const LAST_NAMES = [
  "Perera",
  "Silva",
  "Fernando",
  "Bandara",
  "Jayasinghe",
  "Wijesinghe",
  "Gunawardena",
  "Herath",
  "Dissanayake",
  "Rathnayake",
  "Senanayake",
  "Kumara",
  "Karunaratne",
  "Ekanayake",
  "Samarasinghe",
];

const DISTRICT_LOCATIONS = {
  Ampara: [
    "Ampara",
    "Uhana",
    "Damana",
    "Maha Oya",
    "Dehiattakandiya",
    "Padiyathalawa",
    "Namal Oya",
    "Lahugala",
  ],

  Kandy: [
    "Kandy",
    "Kundasale",
    "Harispattuwa",
    "Akurana",
    "Pathadumbara",
    "Udunuwara",
    "Yatinuwara",
    "Teldeniya",
  ],

  Badulla: [
    "Badulla",
    "Mahiyanganaya",
    "Rideemaliyadda",
    "Passara",
    "Hali Ela",
    "Welimada",
    "Bandarawela",
    "Ella",
  ],

  Monaragala: [
    "Monaragala",
    "Bibile",
    "Medagama",
    "Wellawaya",
    "Buttala",
    "Siyambalanduwa",
    "Thanamalwila",
    "Madulla",
  ],
};

const PADDY_VARIETIES = [
  "nadu",
  "samba",
  "keeri samba",
];

function randomItem(items) {
  return items[
    Math.floor(
      Math.random() *
        items.length
    )
  ];
}

function randomFarmSize() {
  return Number(
    (
      1 +
      Math.random() * 9
    ).toFixed(1)
  );
}

function csvEscape(value) {
  const text =
    String(
      value ?? ""
    );

  if (
    text.includes(",") ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return `"${text.replace(
      /"/g,
      '""'
    )}"`;
  }

  return text;
}

function createFarmer(index) {
  const farmerId =
    `SYN-F-${String(
      index
    ).padStart(
      4,
      "0"
    )}`;

  const firstName =
    randomItem(
      FIRST_NAMES
    );

  const lastName =
    randomItem(
      LAST_NAMES
    );

  const fullName =
    `${firstName} ${lastName}`;

  const district =
    randomItem(
      Object.keys(
        DISTRICT_LOCATIONS
      )
    );

  const location =
    randomItem(
      DISTRICT_LOCATIONS[
        district
      ]
    );

  const farmName =
    `${lastName} Paddy Farm`;

  const farmSizeAcres =
    randomFarmSize();

  const mainPaddyVariety =
    randomItem(
      PADDY_VARIETIES
    );

  /*
   * Deliberately synthetic phone.
   * Do NOT use this for real contact.
   */
  const phone =
    `0000${String(
      index
    ).padStart(
      6,
      "0"
    )}`;

  return {
    farmer_id:
      farmerId,

    full_name:
      fullName,

    phone,

    district,

    location,

    farm_name:
      farmName,

    farm_size_acres:
      farmSizeAcres,

    main_paddy_variety:
      mainPaddyVariety,
  };
}

function generate() {
  const headers = [
    "farmer_id",
    "full_name",
    "phone",
    "district",
    "location",
    "farm_name",
    "farm_size_acres",
    "main_paddy_variety",
  ];

  const farmers = [];

  for (
    let index = 1;
    index <=
    TOTAL_FARMERS;
    index += 1
  ) {
    farmers.push(
      createFarmer(
        index
      )
    );
  }

  const lines = [
    headers.join(","),

    ...farmers.map(
      (farmer) =>
        headers
          .map(
            (header) =>
              csvEscape(
                farmer[
                  header
                ]
              )
          )
          .join(",")
    ),
  ];

  fs.mkdirSync(
    path.dirname(
      OUTPUT_PATH
    ),
    {
      recursive: true,
    }
  );

  fs.writeFileSync(
    OUTPUT_PATH,
    lines.join("\n"),
    "utf8"
  );

  console.log(
    `Generated ${farmers.length} synthetic farmers`
  );

  console.log(
    `CSV created: ${OUTPUT_PATH}`
  );

  console.log(
    "IMPORTANT: This is synthetic research data, not real Farmer data."
  );
}

generate();