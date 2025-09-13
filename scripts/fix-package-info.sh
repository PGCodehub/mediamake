#!/bin/bash

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Run the fixPackageInfo.ts script
echo "Running package info fixer..."
npx ts-node "$SCRIPT_DIR/src/fixPackageInfo.ts"

# Check if the script executed successfully
if [ $? -eq 0 ]; then
  echo "Package info fix completed successfully!"
else
  echo "Package info fix failed with errors."
  exit 1
fi 