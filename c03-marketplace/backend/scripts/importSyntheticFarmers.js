const mongoose =
  require("mongoose");

const fs =
  require("fs");

const path =
  require("path");

const csv =
  require("csv-parser");

const bcrypt =
  require("bcryptjs");

const crypto =
  require("crypto");

const dotenv =
  require("dotenv");

const User =
  require(
    "../src/models/user.model"
  );

const Farmer =
  require(
    "../src/models/farmer.model"
  );

dotenv.config({
  path: path.resolve(
    __dirname,
    "../.env"
  ),
});

const CSV_PATH =
  path.resolve(
    __dirname,
    "../../data/farmers_synthetic.csv"
  );

const OUTPUT_DIR =
  path.resolve(
    __dirname,
    "./output"
  );

const CREDENTIALS_PATH =
  path.resolve(
    OUTPUT_DIR,
    "farmer_credentials.csv"
  );

const PASSWORD_SALT_ROUNDS =
  12;

const rows = [];

function clean(
  value = ""
) {
  return String(
    value
  ).trim();
}

function normalizeUsernamePart(
  value
) {
  return clean(
    value
  )
    .normalize("NFKD")

    .replace(
      /[\u0300-\u036f]/g,
      ""
    )

    .toLowerCase()

    .replace(
      /[^a-z0-9]+/g,
      "."
    )

    .replace(
      /\.+/g,
      "."
    )

    .replace(
      /^\./,
      ""
    )

    .replace(
      /\.$/,
      ""
    );
}

async function createUniqueUsername(
  fullName,
  farmerId
) {
  const baseName =
    normalizeUsernamePart(
      fullName
    ) ||
    "farmer";

  const suffix =
    clean(
      farmerId
    )
      .replace(
        /[^a-zA-Z0-9]/g,
        ""
      )
      .toLowerCase()
      .slice(-4);

  const base =
    `${baseName}.${suffix}`
      .slice(
        0,
        52
      );

  let candidate =
    base;

  let counter = 1;

  while (
    await User.exists({
      username:
        candidate,
    })
  ) {
    candidate =
      `${base}.${counter}`;

    counter += 1;
  }

  return candidate;
}

function createPassword() {
  const randomPart =
    crypto
      .randomBytes(6)
      .toString(
        "base64url"
      );

  const digit =
    crypto.randomInt(
      0,
      10
    );

  return `FgA${digit}-${randomPart}`;
}

function csvEscape(
  value
) {
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

function appendCredential(
  record
) {
  const line = [
    record.farmerId,
    record.fullName,
    record.username,
    record.password,
  ]
    .map(
      csvEscape
    )
    .join(",");

  fs.appendFileSync(
    CREDENTIALS_PATH,
    `${line}\n`,
    "utf8"
  );
}

function validateRow(
  row
) {
  const missing = [];

  if (
    !row.farmerId
  ) {
    missing.push(
      "farmer_id"
    );
  }

  if (
    !row.fullName
  ) {
    missing.push(
      "full_name"
    );
  }

  if (
    !row.phone
  ) {
    missing.push(
      "phone"
    );
  }

  if (
    !row.district
  ) {
    missing.push(
      "district"
    );
  }

  if (
    !row.location
  ) {
    missing.push(
      "location"
    );
  }

  return missing;
}

async function importFarmers() {
  try {
    if (
      !process.env
        .MONGO_URI
    ) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    if (
      !fs.existsSync(
        CSV_PATH
      )
    ) {
      throw new Error(
        `CSV file not found: ${CSV_PATH}`
      );
    }

    fs.mkdirSync(
      OUTPUT_DIR,
      {
        recursive:
          true,
      }
    );

    fs.writeFileSync(
      CREDENTIALS_PATH,
      [
        "farmer_id",
        "full_name",
        "username",
        "password",
      ].join(",") +
        "\n",
      "utf8"
    );

    await mongoose.connect(
      process.env
        .MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    console.log(
      `Reading: ${CSV_PATH}`
    );

    fs.createReadStream(
      CSV_PATH
    )
      .pipe(
        csv({
          mapHeaders: ({
            header,
          }) =>
            header
              .replace(
                /^\uFEFF/,
                ""
              )
              .trim(),
        })
      )

      .on(
        "data",
        (row) => {
          rows.push({
            farmerId:
              clean(
                row.farmer_id
              ),

            fullName:
              clean(
                row.full_name
              ),

            phone:
              clean(
                row.phone
              ),

            district:
              clean(
                row.district
              ),

            location:
              clean(
                row.location
              ),

            farmName:
              clean(
                row.farm_name
              ),

            farmSizeAcres:
              Number(
                row.farm_size_acres ||
                  0
              ),

            mainPaddyVariety:
              clean(
                row.main_paddy_variety
              ),
          });
        }
      )

      .on(
        "end",
        async () => {
          let imported =
            0;

          let skipped =
            0;

          let failed =
            0;

          for (
            const row
            of rows
          ) {
            let createdUser =
              null;

            try {
              const missing =
                validateRow(
                  row
                );

              if (
                missing.length >
                0
              ) {
                console.log(
                  `Skipped incomplete row (${missing.join(
                    ", "
                  )}): ${JSON.stringify(
                    row
                  )}`
                );

                skipped +=
                  1;

                continue;
              }

              /*
               * Search for an existing synthetic
               * Farmer using the generated suffix.
               */
              const suffix =
                row.farmerId
                  .replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                  )
                  .toLowerCase()
                  .slice(-4);

              const existingUser =
                await User.findOne({
                  role:
                    "farmer",

                  verificationSource:
                    "RESEARCH_SYNTHETIC",

                  username: {
                    $regex:
                      new RegExp(
                        `\\.${suffix}(\\.\\d+)?$`,
                        "i"
                      ),
                  },
                });

              if (
                existingUser
              ) {
                console.log(
                  `Skipped ${row.farmerId}: already exists (${existingUser.username})`
                );

                skipped +=
                  1;

                continue;
              }

              const username =
                await createUniqueUsername(
                  row.fullName,
                  row.farmerId
                );

              const password =
                createPassword();

              const hashedPassword =
                await bcrypt.hash(
                  password,
                  PASSWORD_SALT_ROUNDS
                );

              createdUser =
                await User.create({
                  username,

                  fullName:
                    row.fullName,

                  password:
                    hashedPassword,

                  role:
                    "farmer",

                  phone:
                    row.phone,

                  district:
                    row.district,

                  /*
                   * These are test accounts.
                   * No forced reset needed.
                   */
                  mustChangePassword:
                    false,

                  isActive:
                    true,

                  /*
                   * Synthetic Farmer accounts
                   * must NOT appear as verified
                   * real Farmers.
                   */
                  isVerified:
                    false,

                  verificationSource:
                    "RESEARCH_SYNTHETIC",
                });

              await Farmer.create({
                user:
                  createdUser._id,

                farmerName:
                  row.fullName,

                district:
                  row.district,

                location:
                  row.location,

                farmName:
                  row.farmName,

                farmSizeAcres:
                  row.farmSizeAcres,

                mainPaddyVariety:
                  row.mainPaddyVariety,
              });

              appendCredential({
                farmerId:
                  row.farmerId,

                fullName:
                  row.fullName,

                username,

                password,
              });

              console.log(
                `Imported ${row.farmerId} - ${row.fullName}`
              );

              console.log(
                `  Username: ${username}`
              );

              imported +=
                1;
            } catch (
              error
            ) {
              failed +=
                1;

              console.error(
                `Failed ${row.farmerId}:`,
                error.message
              );

              if (
                createdUser?._id
              ) {
                await User.findByIdAndDelete(
                  createdUser._id
                );
              }
            }
          }

          console.log(
            "\nSynthetic Farmer import completed"
          );

          console.log(
            `Imported: ${imported}`
          );

          console.log(
            `Skipped: ${skipped}`
          );

          console.log(
            `Failed: ${failed}`
          );

          console.log(
            `Credentials: ${CREDENTIALS_PATH}`
          );

          console.log(
            "\nIMPORTANT: These are synthetic research accounts, not verified real Farmers."
          );

          await mongoose.disconnect();

          process.exit(
            failed > 0
              ? 1
              : 0
          );
        }
      )

      .on(
        "error",
        async (
          error
        ) => {
          console.error(
            "CSV read failed:",
            error.message
          );

          await mongoose.disconnect();

          process.exit(
            1
          );
        }
      );
  } catch (
    error
  ) {
    console.error(
      "Import failed:",
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
}

importFarmers();