import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import { glob } from 'glob';
import simpleGit from 'simple-git';

export async function extractJSFilesFromZip(filePath) {
  const jsFiles = [];
  const nonJsFiles = [];
  const directory = 'extracted_files';

  try {
    if (!fs.existsSync(directory)) {
      fs.mkdirSync(directory);
    }

    const directoryStream = await unzipper.Open.file(filePath);

    console.log('Files in the ZIP:', directoryStream.files.map(file => file.path));

    for (const file of directoryStream.files) {
      const fullFilePath = path.join(directory, file.path);

      if (file.type === 'Directory') {
        fs.mkdirSync(fullFilePath, { recursive: true });
      } else {
        const content = await file.buffer(); 
        fs.writeFileSync(fullFilePath, content);

        if (file.path.endsWith('.js')) {
          jsFiles.push(fullFilePath);
        } else {
          nonJsFiles.push(fullFilePath);
        }
      }
    }

    console.log('JS Files:', jsFiles);
    console.log('Non-JS Files:', nonJsFiles);

  } catch (error) {
    console.error('Error extracting files from ZIP:', error);
  }

  return { jsFiles, nonJsFiles };
}

export async function cloneAndExtractJSFiles(repoUrl) {
  const git = simpleGit();
  const cloneDir = 'cloned_repo';

  try {

    await git.clone(repoUrl, cloneDir);

    const { jsFiles, nonJsFiles } = extractJSFiles(cloneDir);

    console.log('JS Files from GitHub Repo:', jsFiles);
    console.log('Non-JS Files from GitHub Repo:', nonJsFiles);

    return { jsFiles, nonJsFiles };
  } catch (error) {
    console.error('Error cloning repository:', error);
    return { jsFiles: [], nonJsFiles: [] };
  }
}

function extractJSFiles(directory) {
  const allFiles = glob.sync('**/*', {
    cwd: directory,
    nodir: true,
    absolute: true,
  });

  const jsFiles = [];
  const nonJsFiles = [];

  allFiles.forEach(file => {
    if (path.extname(file) === '.js') {
      jsFiles.push(file);
    } else {
      nonJsFiles.push(file);
    }
  });

  return { jsFiles, nonJsFiles };
}
