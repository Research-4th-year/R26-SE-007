const { spawn } = require("child_process");
const path = require("path");

const predictPrice = (data) => {
  return new Promise((resolve, reject) => {

    const scriptPath = path.join(
      __dirname,
      "../../../fl/prediction.py"
    );

    const python = spawn("python", [
      scriptPath,
      data.district,
      data.paddyType,
      data.season,
      data.quantity.toString()
    ]);

    let output = "";
    let errorOutput = "";

    python.stdout.on("data", (data) => {
      output += data.toString();
    });

    python.stderr.on("data", (data) => {
      errorOutput += data.toString();
    });

    python.on("close", (code) => {

      if (code !== 0) {
        return reject(new Error(errorOutput));
      }

      try {

        const result = JSON.parse(output);

        resolve(result);

      } catch (err) {

        reject(new Error("Invalid JSON returned from prediction engine"));

      }

    });

  });
};

module.exports = {
  predictPrice
};