const {
  spawn,
} = require("child_process");

const path = require("path");

const config =
  require("../config/env.config");

const ApiError =
  require("../utils/ApiError");

const logger =
  require("../config/logger");

const {
  buildAuthenticatedRagContext,
} = require("./rag-context.service");


const RAG_TIMEOUT_MS =
  300000;


/*
 * ==========================================================
 * VALIDATE AUTHENTICATED RAG CONTEXT
 * ==========================================================
 */

function validateAuthenticatedContext(
  authenticatedContext
) {
  if (
    !authenticatedContext ||
    !authenticatedContext.userId ||
    !authenticatedContext.role
  ) {
    throw new ApiError(
      401,
      "Authenticated user context is required."
    );
  }

  const allowedRoles = [
    "farmer",
    "miller",
  ];

  if (
    !allowedRoles.includes(
      authenticatedContext.role
    )
  ) {
    throw new ApiError(
      403,
      "RAG assistant is available only to Farmers and Millers."
    );
  }

  return {
    userId:
      authenticatedContext.userId,

    role:
      authenticatedContext.role,
  };
}


/*
 * ==========================================================
 * ASK RAG QUESTION
 * ==========================================================
 */

const askQuestion = async (
  question,
  authenticatedContext
) => {

  /*
   * Validate authenticated context
   * before starting the Python RAG engine.
   */
  const safeAuthContext =
    validateAuthenticatedContext(
      authenticatedContext
    );


  /*
   * ========================================================
   * BUILD PERSONALIZED AUTHENTICATED CONTEXT
   * ========================================================
   *
   * This data comes from MongoDB using the authenticated
   * userId. The frontend does NOT provide the identity.
   */
  const personalizedContext =
    await buildAuthenticatedRagContext(
      safeAuthContext.userId,
      safeAuthContext.role
    );


  return new Promise(
    (
      resolve,
      reject
    ) => {

      const scriptPath =
        path.resolve(
          __dirname,
          "../../",
          config.rag.scriptPath
        );


      logger.info(
        `Running RAG query using ${scriptPath}`
      );


      logger.info(
        `RAG request authenticated for role=${safeAuthContext.role}`
      );


      /*
       * ======================================================
       * BUILD PYTHON PAYLOAD
       * ======================================================
       *
       * Python expects:
       *
       * {
       *   question: "...",
       *   userContext: {
       *     role: "...",
       *     profile: {...},
       *     harvests: [...],
       *     demands: [...]
       *   }
       * }
       *
       * The frontend never supplies this information.
       */
      const pythonPayload = {
        question,

        userContext: {
          role:
            personalizedContext.userRole,

          profile:
            personalizedContext.userRole ===
            "farmer"
              ? personalizedContext.farmer
              : personalizedContext.miller,

          harvests:
            personalizedContext.harvests ||
            [],

          demands:
            personalizedContext.demands ||
            [],
        },
      };


      /*
       * ======================================================
       * START PYTHON PROCESS
       * ======================================================
       */

      const pythonProcess = spawn("python", ["-u", scriptPath], {
        env: {
          ...process.env,

          PYTHONIOENCODING: "utf-8",

          PYTHONUTF8: "1",

          PYTHONUNBUFFERED: "1",
        },

        stdio: ["pipe", "pipe", "pipe"],
      });


      /*
       * ======================================================
       * SEND JSON TO PYTHON
       * ======================================================
       */

      pythonProcess.stdin.write(
        JSON.stringify(
          pythonPayload
        )
      );

      pythonProcess.stdin.end();


      let dataString = "";

      let errorString = "";

      let completed = false;


      /*
       * ======================================================
       * TIMEOUT
       * ======================================================
       */

      const timeout =
        setTimeout(
          () => {

            if (
              completed
            ) {
              return;
            }

            completed = true;

            pythonProcess.kill();

            logger.error(
              "RAG Python process timed out."
            );

            reject(
              new ApiError(
                504,
                "The AI marketplace assistant took too long to respond."
              )
            );

          },
          RAG_TIMEOUT_MS
        );


      /*
       * ======================================================
       * PYTHON STDOUT
       * ======================================================
       */

      pythonProcess.stdout.on(
        "data",
        (
          data
        ) => {

          dataString +=
            data.toString();

        }
      );


      /*
       * ======================================================
       * PYTHON STDERR
       * ======================================================
       */

      pythonProcess.stderr.on(
        "data",
        (
          data
        ) => {

          const text =
            data.toString();

          errorString +=
            text;

          logger.error(
            `Python RAG error: ${text}`
          );

        }
      );


      /*
       * ======================================================
       * PROCESS START ERROR
       * ======================================================
       */

      pythonProcess.on(
        "error",
        (
          error
        ) => {

          if (
            completed
          ) {
            return;
          }

          completed = true;

          clearTimeout(
            timeout
          );

          logger.error(
            `Failed to start RAG Python process: ${error.message}`
          );

          reject(
            new ApiError(
              500,
              "Unable to start the RAG engine."
            )
          );

        }
      );


      /*
       * ======================================================
       * PROCESS CLOSE
       * ======================================================
       */

      pythonProcess.on(
        "close",
        (
          code
        ) => {

          if (
            completed
          ) {
            return;
          }

          completed = true;

          clearTimeout(
            timeout
          );


          /*
           * Python process failed.
           */
          if (
            code !== 0
          ) {

            logger.error(
              `RAG process exited with code ${code}. ${errorString}`
            );

            logger.error(
              `RAG stdout: ${dataString}`
            );

            return reject(
              new ApiError(
                500,
                "Error processing the marketplace assistant query."
              )
            );

          }


          /*
           * ==================================================
           * PARSE PYTHON JSON
           * ==================================================
           */

          try {

            const cleaned =
              dataString.trim();


            if (
              !cleaned
            ) {

              throw new Error(
                "RAG engine returned an empty response."
              );

            }


            const result =
              JSON.parse(
                cleaned
              );


            if (
              result.error
            ) {

              throw new Error(
                result.error
              );

            }


            /*
             * Attach authenticated context internally.
             *
             * Only the role is attached.
             *
             * Sensitive negotiation values are never
             * returned to the mobile client.
             */


            resolve(
              result
            );

          } catch (
            error
          ) {

            logger.error(
              `Failed to parse RAG output: ${dataString}`
            );

            logger.error(
              `RAG parse error: ${error.message}`
            );

            reject(
              new ApiError(
                500,
                "Invalid response from the RAG engine."
              )
            );

          }

        }
      );

    }
  );
};


module.exports = {
  askQuestion,
};