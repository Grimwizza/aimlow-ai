import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {codeInput} from '@sanity/code-input' // <--- 1. ADD THIS IMPORT

export default defineConfig({
  name: 'default',
  title: 'aimlow',

  projectId: '...', // Keep your ID
  dataset: 'production',

  plugins: [
    structureTool(), 
    visionTool(), 
    codeInput() // <--- 2. ADD THIS FUNCTION CALL
  ],

  schema: {
    types: schemaTypes,
  },
})