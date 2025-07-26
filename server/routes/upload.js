import express from 'express';
import multer from 'multer';
import { extractJSFilesFromZip, cloneAndExtractJSFiles } from '../utils/fileProcessor.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/zip', upload.single('project'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const filePath = req.file.path;
    const result = await extractJSFilesFromZip(filePath);
    res.json(result);
  } catch (error) {
    console.error('Error in /file route:', error.message);
    res.status(500).json({ error: 'Failed to process ZIP file.' });
  }
});

router.post('/github', async (req, res) => {
  try {
    const { repoUrl } = req.body;
    if (!repoUrl) return res.status(400).json({ error: 'repoUrl is required' });

    const result = await cloneAndExtractJSFiles(repoUrl);
    res.json(result);
  } catch (error) {
    console.error('Error in /github route:', error.message);
    res.status(500).json({ error: 'Failed to clone GitHub repository.' });
  }
});

export default router;
