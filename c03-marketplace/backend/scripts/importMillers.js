import mongoose from "mongoose";
import fs from "fs";
import csv from "csv-parser";
import dotenv from "dotenv";
import Miller from "../src/models/miller.model.js";

dotenv.config();

mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Mongo Connected"))
    .catch(err => console.log(err));

const results = [];

fs.createReadStream("../data/millers.csv")
    .pipe(csv())
    .on("data", (data) => {
        results.push({
            name: data.name,
            mill_name: data.mill_name,
            district: data.district,
            location: data.location
        });
    })
    .on("end", async () => {
        try {
            await Miller.insertMany(results);
            console.log("Millers imported successfully");
            process.exit();
        } catch (err) {
            console.log(err);
        }
    });