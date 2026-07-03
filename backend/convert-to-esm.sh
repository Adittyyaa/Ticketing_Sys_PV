#!/bin/bash

# Convert routes
for file in src/routes/auth.js src/routes/admin.js src/routes/tickets.js src/routes/solutions.js src/routes/feedback.js; do
  if [ -f "$file" ]; then
    # Convert require to import
    sed -i '' "s/const { Router } = require('express');/import { Router } from 'express';/g" "$file"
    sed -i '' "s/const router = Router();/const router = Router();/g" "$file"
    
    # Convert controller requires to imports
    sed -i '' "s/const { \(.*\) } = require('\(.*\)');/import { \1 } from '\2';/g" "$file"
    sed -i '' "s/const \(.*\) = require('\(.*\)');/import \1 from '\2';/g" "$file"
    
    # Convert middleware requires to imports
    sed -i '' "s/require('\.\.\//import '/g" "$file"
    
    # Add .js extensions to relative imports if missing
    sed -i '' "s/from '\.\.\//from '..\\//g" "$file"
    sed -i '' "s/from '\.\//from '.\\//g" "$file"
    
    # Convert module.exports to export default
    sed -i '' "s/module\.exports = /export default /g" "$file"
    
    echo "Converted $file"
  fi
done

# Convert controllers
for file in src/controllers/*.js; do
  if [ -f "$file" ]; then
    # Convert requires to imports
    sed -i '' "s/const { \(.*\) } = require('\(.*\)');/import { \1 } from '\2';/g" "$file"
    sed -i '' "s/const \(.*\) = require('\(.*\)');/import \1 from '\2';/g" "$file"
    
    # Convert module.exports to named exports
    sed -i '' "s/module\.exports = {/export {/g" "$file"
    
    echo "Converted $file"
  fi
done

# Convert models
for file in src/models/*.js; do
  if [ "$file" != "src/models/index.js" ]; then
    if [ -f "$file" ]; then
      # Convert requires to imports
      sed -i '' "s/const { DataTypes } = require('sequelize');/import { DataTypes } from 'sequelize';/g" "$file"
      sed -i '' "s/const sequelize = require('\.\.\//import sequelize from '..\\//g" "$file"
      
      # Convert module.exports to export default
      sed -i '' "s/module\.exports = /export default /g" "$file"
      
      echo "Converted $file"
    fi
  fi
done

echo "Conversion complete!"
