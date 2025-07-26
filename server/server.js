import express from 'express';
import cors from 'cors';
import uploadRoutes from './routes/upload.js';
import analyzeRoutes from './routes/analyze.js'; 

const app = express();

app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/upload', uploadRoutes);
app.use('/api/analyze', analyzeRoutes);

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
