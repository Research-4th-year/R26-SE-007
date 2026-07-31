const { spawn } = require("child_process");
const path = require("path");

const predictPrice = (data) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.resolve(
      __dirname,
      "../../../fl/prediction.py"
    );

    const pythonCommand = process.env.PYTHON_PATH || "python";

    const python = spawn(pythonCommand, [
      scriptPath,
      String(data.district).trim().toLowerCase(),
      String(data.paddyType).trim().toLowerCase(),
      String(data.season).trim().toLowerCase(),
      String(data.quantity),
    ]);

    let output = "";
    let errorOutput = "";
    let settled = false;

    const fail = (error) => {
      if (!settled) {
        settled = true;
        reject(error);
      }
    };

    python.stdout.on("data", (chunk) => {
      output += chunk.toString();
    });

    python.stderr.on("data", (chunk) => {
      errorOutput += chunk.toString();
    });

    python.on("error", (error) => {
      fail(
        new Error(
          `Unable to start the Python prediction engine using "${pythonCommand}": ${error.message}`
        )
      );
    });

    python.on("close", (code) => {
      if (settled) return;

      const stdout = output.trim();
      const stderr = errorOutput.trim();

      let parsedOutput = null;

      if (stdout) {
        try {
          parsedOutput = JSON.parse(stdout);
        } catch (_) {
          parsedOutput = null;
        }
      }

      if (code !== 0) {
        const message =
          parsedOutput?.error ||
          stderr ||
          stdout ||
          `Prediction process exited with code ${code}`;

        return fail(new Error(message));
      }

      if (!parsedOutput) {
        return fail(
          new Error(
            stderr || "Invalid JSON returned from prediction engine"
          )
        );
      }

      if (parsedOutput.error) {
        return fail(new Error(parsedOutput.error));
      }

      if (parsedOutput.predictedPrice === undefined) {
        return fail(
          new Error(
            "Prediction engine did not return predictedPrice"
          )
        );
      }

      settled = true;
      resolve(parsedOutput);
    });
  });
};

module.exports = {
  predictPrice,
};
