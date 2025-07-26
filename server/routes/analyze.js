import express from 'express';
import AdmZip from 'adm-zip';
import fetch from 'node-fetch';
import { analyzeJS } from '../utils/analyzer.js';

const router = express.Router();

function analyzeCodeForSuggestions(code) {
  let suggestions = [];

  if (code.length > 100) {
    suggestions.push('Refactor this function, it\'s too long.');
  }

  if (code.includes('unusedVariable')) {
    suggestions.push('Remove or refactor unused variable.');
  }

  if (code.length <= 50) {
    suggestions.push('Good practice: This function is concise.');
  }

  return suggestions;
}

function processZipEntries(zip) {
  const result = [];

  zip.getEntries().forEach(entry => {
    if (entry.entryName.endsWith('.js')) {
      const code = zip.readAsText(entry);
      console.log(`Processing file: ${entry.entryName}`);
      try {
        const analyzedItems = analyzeJS(code).analyzedItems;
        analyzedItems.forEach(item => {
          const codeSuggestions = analyzeCodeForSuggestions(item.code);
          item.suggestions = codeSuggestions;
          item.isGoodPractice = codeSuggestions.includes('Good practice: This function is concise.');
        });

        result.push({
          file: entry.entryName,
          items: analyzedItems
        });
      } catch (err) {
        console.error(`Error processing file ${entry.entryName}:`, err.message);
        result.push({
          file: entry.entryName,
          error: `Failed to analyze file: ${err.message}`
        });
      }
    }
  });

  return result;
}

router.post('/', (req, res) => {
  const contentType = req.headers['content-type'];
  if (!contentType?.startsWith('application/zip')) {
    return res.status(400).json({ error: 'Invalid content-type, expected application/zip' });
  }

  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', () => {
    const buffer = Buffer.concat(chunks);
    try {
      const zip = new AdmZip(buffer);
      const results = processZipEntries(zip);

      if (results.length === 0) {
        return res.status(404).json({ error: 'No valid JavaScript files found in the ZIP' });
      }

      res.json({ files: results });
    } catch (err) {
      console.error('Error analyzing ZIP file:', err.message);
      res.status(500).json({ error: 'Failed to analyze zip file', detail: err.message });
    }
  });
});

router.get('/', async (req, res) => {
  const githubUrl = req.query.github;
  if (!githubUrl) return res.status(400).json({ error: 'Missing GitHub URL' });

  try {
    const repoPath = githubUrl.replace('https://github.com/', '');
    const zipUrl = `https://github.com/${repoPath}/archive/refs/heads/main.zip`;

    const response = await fetch(zipUrl);
    if (!response.ok) throw new Error('Failed to download repo');

    const buffer = await response.buffer();
    const zip = new AdmZip(buffer);
    const results = processZipEntries(zip);

    if (results.length === 0) {
      return res.status(404).json({ error: 'No valid JavaScript files found in the ZIP from GitHub' });
    }

    res.json({ files: results });
  } catch (err) {
    console.error('GitHub analysis failed:', err.message);
    res.status(500).json({ error: 'GitHub analysis failed', detail: err.message });
  }
});

export default router;

