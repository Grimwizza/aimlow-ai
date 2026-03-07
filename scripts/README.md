# Price Tracker Cron Script

This directory contains a standalone Node.js script `price-tracker-cron.js` designed for automated, scheduled execution of the MAP / Price Tracker tool. It runs seamlessly in the background to handle daily pricing updates without requiring you to open the React UI.

## Requirements

1. Make sure you have run `npm install` in the root directory to install required packages (`dotenv`, `xlsx`).
2. Your `.env` file must be located in the root of the project with your `VITE_GEMINI_API_KEY` (and optional BestBuy/eBay keys).

## Usage

```bash
node scripts/price-tracker-cron.js --input <path-to-excel-file> [--output <output-directory>]
```

- `--input`: (Required) Path to the `.xlsx` file containing the products you want to scan. This file uses the same template format as the React app.
- `--output`: (Optional) Directory to save the resulting `.xlsx` report. If omitted, it saves to the same directory as the input file.

Example:
```bash
node scripts/price-tracker-cron.js --input ./data/my-products.xlsx --output ./data/results
```

## Scheduling with Mac Cron

You can use macOS's built-in `cron` utility to run this script automatically on a schedule.

1. Open your terminal.
2. Type `crontab -e` to edit your cron schedule.
3. Add a line at the bottom to define your schedule. The format is `minute hour day month day-of-week command`.

**Example: Run daily at 8:00 AM**
```bash
# Edit crontab
crontab -e

# Add this line (replace paths with your actual system paths):
0 8 * * * /usr/local/bin/node /Users/benluebbert/Documents/Sites/aimlow-ai/scripts/price-tracker-cron.js --input /Users/benluebbert/Documents/Sites/aimlow-ai/data/products.xlsx --output /Users/benluebbert/Documents/Sites/aimlow-ai/data/results/ >> /Users/benluebbert/Documents/Sites/aimlow-ai/cron.log 2>&1
```

*Note: Ensure the path to the `node` executable is absolute (you can find it by typing `which node` in your terminal).*
