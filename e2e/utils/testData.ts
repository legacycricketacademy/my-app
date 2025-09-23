import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load test data
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const testDataPath = join(__dirname, '../data/testData.json');
const testData = JSON.parse(readFileSync(testDataPath, 'utf8'));

export default testData;
