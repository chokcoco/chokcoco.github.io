import { FileBlob, SpreadsheetFile } from "@oai/artifact-tool";

const files = process.argv.slice(2);

for (const file of files) {
  const workbook = await SpreadsheetFile.importXlsx(await FileBlob.load(file));
  const overview = await workbook.inspect({
    kind: "workbook,sheet,table",
    maxChars: 50000,
    tableMaxRows: 60,
    tableMaxCols: 12,
    tableMaxCellChars: 160,
  });
  process.stdout.write(`\n### ${file}\n${overview.ndjson}\n`);
}
