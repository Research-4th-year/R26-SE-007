const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const dotenv = require("dotenv");

const User = require("../src/models/user.model");
const Miller = require("../src/models/miller.model");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

// ======================================================
// FILE PATHS
// ======================================================

// Your new CSV:
// name,phone,mill_name,location,district,reg_no
const CSV_PATH = path.resolve(
  __dirname,
  "../../data/millers_migrate.csv"
);

// Generated credentials will be stored here.
const OUTPUT_DIR = path.resolve(
  __dirname,
  "./output"
);

const CREDENTIALS_PATH = path.resolve(
  OUTPUT_DIR,
  "miller_credentials.csv"
);

const PASSWORD_SALT_ROUNDS = 12;

const rows = [];

// ======================================================
// CLEAN VALUES
// ======================================================

function clean(value = "") {
  return String(value).trim();
}

// Remove spaces and "-" characters from phone numbers.
function normalizePhone(value = "") {
  return clean(value)
    .replace(/\s+/g, "")
    .replace(/-/g, "");
}

// ======================================================
// REGISTRATION NUMBER
// ======================================================

// Example:
//
// PMB/AMP/Mill/2025/233
//
// becomes:
//
// 233
//
function registrationSuffix(registrationNumber) {
  const parts = clean(registrationNumber)
    .split("/")
    .filter(Boolean);

  const last =
    parts[parts.length - 1] || "";

  return last
    .replace(/[^a-zA-Z0-9]/g, "")
    .toLowerCase();
}

// ======================================================
// USERNAME GENERATION
// ======================================================

// Example:
//
// K. A. Silva
//
// becomes:
//
// k.a.silva
//
function normalizeNameForUsername(name) {
  return clean(name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9.]+/g, ".")
    .replace(/\.+/g, ".")
    .replace(/^\./, "")
    .replace(/\.$/, "");
}

// Example:
//
// Name:
// K. A. Silva
//
// Registration:
// PMB/AMP/Mill/2025/233
//
// Username:
// k.a.silva.233
//
async function createUniqueUsername(
  name,
  registrationNumber
) {
  const baseName =
    normalizeNameForUsername(name) ||
    "miller";

  const suffix =
    registrationSuffix(
      registrationNumber
    ) ||
    crypto
      .randomInt(100, 999)
      .toString();

  const base =
    `${baseName}.${suffix}`.slice(
      0,
      52
    );

  let candidate = base;
  let counter = 1;

  // Make sure username is unique.
  while (
    await User.exists({
      username: candidate,
    })
  ) {
    candidate =
      `${base}.${counter}`;

    counter += 1;
  }

  return candidate;
}

// ======================================================
// TEMPORARY PASSWORD
// ======================================================

// Generates a random first-login password.
//
// We DO NOT use:
// - NIC
// - phone number
// - registration number
//
// because those are predictable.
//
function createTemporaryPassword() {
  const randomPart =
    crypto
      .randomBytes(6)
      .toString("base64url");

  const digit =
    crypto.randomInt(0, 10);

  return `DgA${digit}-${randomPart}`;
}

// ======================================================
// CSV OUTPUT HELPERS
// ======================================================

function csvEscape(value) {
  const text =
    String(value ?? "");

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

function appendCredentialRow(
  record
) {
  const line = [
    record.name,
    record.millName,
    record.registrationNumber,
    record.phone,
    record.username,
    record.temporaryPassword,
  ]
    .map(csvEscape)
    .join(",");

  fs.appendFileSync(
    CREDENTIALS_PATH,
    `${line}\n`,
    "utf8"
  );
}

// ======================================================
// VALIDATE CSV ROW
// ======================================================

function validateRow(row) {
  const missing = [];

  if (!row.name) {
    missing.push("name");
  }

  if (!row.phone) {
    missing.push("phone");
  }

  if (!row.millName) {
    missing.push("mill_name");
  }

  if (!row.location) {
    missing.push("location");
  }

  if (!row.district) {
    missing.push("district");
  }

  if (!row.registrationNumber) {
    missing.push("reg_no");
  }

  return missing;
}

// ======================================================
// IMPORT MILLERS
// ======================================================

async function importMillers() {
  try {
    // --------------------------------------------------
    // 1. Check MongoDB configuration
    // --------------------------------------------------

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from backend/.env"
      );
    }

    // --------------------------------------------------
    // 2. Check CSV exists
    // --------------------------------------------------

    if (!fs.existsSync(CSV_PATH)) {
      throw new Error(
        `CSV file was not found: ${CSV_PATH}`
      );
    }

    // --------------------------------------------------
    // 3. Create output directory
    // --------------------------------------------------

    fs.mkdirSync(
      OUTPUT_DIR,
      {
        recursive: true,
      }
    );

    // --------------------------------------------------
    // 4. Create credentials CSV
    // --------------------------------------------------

    fs.writeFileSync(
      CREDENTIALS_PATH,
      [
        "name",
        "mill_name",
        "registration_number",
        "phone",
        "username",
        "temporary_password",
      ].join(",") + "\n",
      "utf8"
    );

    // --------------------------------------------------
    // 5. Connect MongoDB
    // --------------------------------------------------

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "MongoDB connected"
    );

    console.log(
      `Reading: ${CSV_PATH}`
    );

    // --------------------------------------------------
    // 6. Read CSV
    // --------------------------------------------------

    fs.createReadStream(CSV_PATH)
  .pipe(
    csv({
      mapHeaders: ({ header }) =>
        header
          .replace(/^\uFEFF/, "")
          .trim(),
    })
  )

      .on(
        "data",
        (row) => {
          rows.push({
            name:
              clean(row.name),

            phone:
              normalizePhone(
                row.phone
              ),

            millName:
              clean(
                row.mill_name
              ),

            location:
              clean(
                row.location
              ),

            district:
              clean(
                row.district
              ),

            registrationNumber:
              clean(
                row.reg_no
              ),
          });
        }
      )

      // =================================================
      // CSV READING FINISHED
      // =================================================

      .on(
        "end",
        async () => {
          let imported = 0;
          let updated = 0;
          let skipped = 0;
          let failed = 0;

          // =============================================
          // PROCESS EACH MILLER
          // =============================================

          for (
            const row of rows
          ) {
            let createdUser =
              null;

            try {
              // -----------------------------------------
              // Validate row
              // -----------------------------------------

              const missing =
                validateRow(row);

              if (
                missing.length > 0
              ) {
                console.log(
                  `Skipped incomplete row (${missing.join(
                    ", "
                  )}): ${JSON.stringify(
                    row
                  )}`
                );

                skipped += 1;

                continue;
              }

              // -----------------------------------------
              // Check existing Miller using PMB
              // registration number
              // -----------------------------------------

              const existingMiller =
                await Miller.findOne({
                  businessRegistrationNumber:
                    row.registrationNumber,
                });

              // =========================================
              // EXISTING MILLER
              // =========================================

              if (
                existingMiller
              ) {
                const existingUser =
                  await User.findById(
                    existingMiller.user
                  );

                if (
                  !existingUser
                ) {
                  console.log(
                    `Skipped ${row.registrationNumber}: Miller exists but linked User is missing`
                  );

                  skipped += 1;

                  continue;
                }

                // Update real data from latest PMB CSV.

                existingUser.fullName =
                  row.name;

                existingUser.phone =
                  row.phone;

                existingUser.district =
                  row.district;

                existingUser.role =
                  "miller";

                existingUser.isActive =
                  true;

                existingUser.isVerified =
                  true;

                existingUser.verificationSource =
                  "PMB";

                // ---------------------------------------
                // Old imported users may not have
                // usernames.
                // ---------------------------------------

                if (
                  !existingUser.username
                ) {
                  existingUser.username =
                    await createUniqueUsername(
                      row.name,
                      row.registrationNumber
                    );
                }

                await existingUser.save();

                // ---------------------------------------
                // Update Miller profile
                // ---------------------------------------

                existingMiller.name =
                  row.name;

                existingMiller.millName =
                  row.millName;

                existingMiller.location =
                  row.location;

                existingMiller.district =
                  row.district;

                existingMiller.businessRegistrationNumber =
                  row.registrationNumber;

                await existingMiller.save();

                console.log(
                  `Updated ${row.registrationNumber} -> ${existingUser.username}`
                );

                updated += 1;

                continue;
              }

              // =========================================
              // NEW MILLER
              // =========================================

              // Generate username.

              const username =
                await createUniqueUsername(
                  row.name,
                  row.registrationNumber
                );

              // Generate temporary password.

              const temporaryPassword =
                createTemporaryPassword();

              // Hash temporary password.

              const hashedPassword =
                await bcrypt.hash(
                  temporaryPassword,
                  PASSWORD_SALT_ROUNDS
                );

              // -----------------------------------------
              // Create User
              // -----------------------------------------

              createdUser =
                await User.create({
                  username,

                  fullName:
                    row.name,

                  password:
                    hashedPassword,

                  role:
                    "miller",

                  phone:
                    row.phone,

                  district:
                    row.district,

                  // Force first-login password change.
                  mustChangePassword:
                    true,

                  isActive:
                    true,

                  // PMB supplied Miller data.
                  isVerified:
                    true,

                  verificationSource:
                    "PMB",
                });

              // -----------------------------------------
              // Create Miller profile
              // -----------------------------------------

              await Miller.create({
                user:
                  createdUser._id,

                name:
                  row.name,

                millName:
                  row.millName,

                district:
                  row.district,

                location:
                  row.location,

                businessRegistrationNumber:
                  row.registrationNumber,

                purchasingCapacityKg:
                  0,
              });

              // -----------------------------------------
              // Save login credentials
              // -----------------------------------------

              appendCredentialRow({
                name:
                  row.name,

                millName:
                  row.millName,

                registrationNumber:
                  row.registrationNumber,

                phone:
                  row.phone,

                username,

                temporaryPassword,
              });

              console.log(
                `Imported ${row.registrationNumber} - ${row.name}`
              );

              console.log(
                `  Username: ${username}`
              );

              console.log(
                "  Temporary password created"
              );

              imported += 1;
            } catch (error) {
              failed += 1;

              console.error(
                `Failed to import ${
                  row.registrationNumber ||
                  row.name ||
                  "unknown row"
                }:`,
                error.message
              );

              // -----------------------------------------
              // Prevent orphan User
              // -----------------------------------------

              if (
                createdUser?._id
              ) {
                await User.findByIdAndDelete(
                  createdUser._id
                );
              }
            }
          }

          // =============================================
          // FINAL RESULT
          // =============================================

          console.log(
            "\nPMB Miller import completed"
          );

          console.log(
            `Imported: ${imported}`
          );

          console.log(
            `Updated: ${updated}`
          );

          console.log(
            `Skipped: ${skipped}`
          );

          console.log(
            `Failed: ${failed}`
          );

          console.log(
            `Credentials file: ${CREDENTIALS_PATH}`
          );

          console.log(
            "\nIMPORTANT: Keep the credentials CSV private and do not commit it to Git."
          );

          await mongoose.disconnect();

          process.exit(
            failed > 0
              ? 1
              : 0
          );
        }
      )

      // =================================================
      // CSV ERROR
      // =================================================

      .on(
        "error",
        async (error) => {
          console.error(
            "CSV reading failed:",
            error.message
          );

          await mongoose.disconnect();

          process.exit(1);
        }
      );
  } catch (error) {
    console.error(
      "Import failed:",
      error.message
    );

    await mongoose.disconnect();

    process.exit(1);
  }
}

// ======================================================
// START
// ======================================================

importMillers();