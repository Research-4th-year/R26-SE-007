const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");

const User = require("../src/models/user.model");
const Miller = require("../src/models/miller.model");

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
});

const CSV_PATH = path.resolve(
  __dirname,
  "../../data/millers.csv"
);

const results = [];

function clean(value = "") {
  return String(value).trim();
}

function createEmail(datasetId) {
  return `${datasetId.toLowerCase()}@digitalgoviya.local`;
}

function createPhone(datasetId) {
  return `000000${datasetId.toUpperCase()}`;
}

function createTemporaryPassword(datasetId) {
  return `Miller@${datasetId.toUpperCase()}`;
}

async function importMillers() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is missing from backend/.env");
    }

    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");

    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on("data", (row) => {
        results.push({
          id: clean(row.id),
          name: clean(row.name),
          millName: clean(row.mill_name),
          location: clean(row.location),
          district: clean(row.district),
        });
      })
      .on("end", async () => {
        let imported = 0;
        let skipped = 0;
        let failed = 0;

        for (const row of results) {
          let createdUser = null;

          try {
            if (
              !row.id ||
              !row.name ||
              !row.millName ||
              !row.location ||
              !row.district
            ) {
              console.log(
                `Skipped incomplete row: ${JSON.stringify(row)}`
              );

              skipped += 1;
              continue;
            }

            const email = createEmail(row.id);
            const phone = createPhone(row.id);
            const temporaryPassword =
              createTemporaryPassword(row.id);

            const existingUser = await User.findOne({
              email,
            });

            if (existingUser) {
              const existingMiller = await Miller.findOne({
                user: existingUser._id,
              });

              if (existingMiller) {
                console.log(
                  `Skipped ${row.id}: user and miller already exist`
                );

                skipped += 1;
                continue;
              }

              await Miller.create({
                user: existingUser._id,
                name: row.name,
                millName: row.millName,
                district: row.district,
                location: row.location,
                businessRegistrationNumber: row.id,
                purchasingCapacityKg: 0,
              });

              console.log(
                `Created missing Miller profile for ${email}`
              );

              imported += 1;
              continue;
            }

            const hashedPassword = await bcrypt.hash(
              temporaryPassword,
              12
            );

            createdUser = await User.create({
              fullName: row.name,
              email,
              password: hashedPassword,
              role: "miller",
              phone,
              district: row.district,
              isActive: true,
              isVerified: false,
            });

            await Miller.create({
              user: createdUser._id,
              name: row.name,
              millName: row.millName,
              district: row.district,
              location: row.location,

              // Store the dataset ID here unless you have
              // a real registration number column.
              businessRegistrationNumber: row.id,

              purchasingCapacityKg: 0,
            });

            console.log(`Imported ${row.id} - ${row.name}`);
            console.log(`  Email: ${email}`);
            console.log(
              `  Temporary password: ${temporaryPassword}`
            );

            imported += 1;
          } catch (error) {
            failed += 1;

            console.error(
              `Failed to import ${row.id || "unknown row"}:`,
              error.message
            );

            // Remove the User if its Miller profile failed.
            if (createdUser?._id) {
              await User.findByIdAndDelete(createdUser._id);
            }
          }
        }

        console.log("\nImport completed");
        console.log(`Imported: ${imported}`);
        console.log(`Skipped: ${skipped}`);
        console.log(`Failed: ${failed}`);

        await mongoose.disconnect();
        process.exit(failed > 0 ? 1 : 0);
      })
      .on("error", async (error) => {
        console.error("CSV reading failed:", error.message);

        await mongoose.disconnect();
        process.exit(1);
      });
  } catch (error) {
    console.error("Import failed:", error.message);

    await mongoose.disconnect();
    process.exit(1);
  }
}

importMillers();