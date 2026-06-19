import fs from 'fs';

const logPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\4d1a100a-a9f4-41c0-ae5a-bb1875676e85\\.system_generated\\logs\\transcript.jsonl';

if (fs.existsSync(logPath)) {
  const lines = fs.readFileSync(logPath, 'utf8').split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    try {
      const obj = JSON.parse(line);
      if (obj.type === 'BROWSER_SUBAGENT') {
        console.log(`Line ${i}: source=${obj.source}, type=${obj.type}, status=${obj.status}`);
        if (obj.content) {
          console.log(`Content (length ${obj.content.length}):`);
          // Print first 500 chars and last 500 chars
          console.log(obj.content.slice(0, 500));
          console.log("...");
          console.log(obj.content.slice(-500));
        }
      }
    } catch (e) {
      // ignore
    }
  }
} else {
  console.log("Log path not found");
}
