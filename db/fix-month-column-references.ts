import { pool, db } from './index';
import { sql } from 'drizzle-orm';

/**
 * Removes references to the non-existent 'month' column in payment queries
 * This fixes SQL errors in getAllPayments and getPendingPayments methods
 */
async function fixMonthColumnReferences() {
  try {
    console.log("Starting fix for month column references in payment queries...");
    
    // Read the current storage.ts file
    const fs = require('fs');
    const path = require('path');
    const storageFilePath = path.join(process.cwd(), 'server', 'storage.ts');
    
    if (!fs.existsSync(storageFilePath)) {
      console.error(`File not found: ${storageFilePath}`);
      return;
    }
    
    let content = fs.readFileSync(storageFilePath, 'utf8');
    
    // Replace the problematic CASE statements with NULL AS "month"
    const monthCaseRegex = /CASE\s+WHEN\s+EXISTS\s+\(\s+SELECT\s+1\s+FROM\s+information_schema\.columns\s+WHERE\s+table_name\s+=\s+'payments'\s+AND\s+column_name\s+=\s+'month'\s+\)\s+THEN\s+p\.month\s+ELSE\s+NULL\s+END\s+AS\s+"month",/g;
    const replacement = 'NULL AS "month", /* Fixed month column reference */';
    
    const updatedContent = content.replace(monthCaseRegex, replacement);
    
    if (content === updatedContent) {
      console.log("No replacements made - pattern not found");
      return;
    }
    
    // Write the updated content back to the file
    fs.writeFileSync(storageFilePath, updatedContent, 'utf8');
    
    console.log("Successfully fixed month column references in storage.ts");
  } catch (error) {
    console.error("Error fixing month column references:", error);
  }
}

// Run the function if this file is executed directly
if (require.main === module) {
  fixMonthColumnReferences()
    .then(() => process.exit(0))
    .catch(error => {
      console.error("Error:", error);
      process.exit(1);
    });
}