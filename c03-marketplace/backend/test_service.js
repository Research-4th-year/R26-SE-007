const { ragService } = require('./src/services');

async function run() {
  try {
    console.log("Testing RAG service...");
    const result = await ragService.askQuestion("price of red rice");
    console.log("Result:", JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
