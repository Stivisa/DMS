const express = require('express');
const simpleGit = require('simple-git');
const path = require('path');
const fs = require('fs-extra');
const { getDmsFolderPath } = require('./storage');
const dotenv = require("dotenv");
const os = require('os');
const { exec } = require('child_process');
const util = require('util');

dotenv.config();
const repoUrl = process.env.GIT_REPO_URL;
const git = simpleGit();

const execPromise = util.promisify(exec);

async function cloneOrUpdateRepo() {
  const ipAddress = getIPAddress();
  //console.log('IP Address:', ipAddress);
  
  const localPath = path.join(getDmsFolderPath(), 'program');
  const localPathFront = path.join(localPath, 'DMSfront');
  const localPathBack = path.join(localPath, 'DMSback');

  const destPath = path.join(getDmsFolderPath(), 'production');
  const destPathFront = path.join(destPath, 'DMSfront');
  const destPathBack = path.join(destPath, 'DMSback');


  try {
    if (fs.existsSync(localPath)) {
      console.log('Updating existing repository...');
      await git.cwd(localPath).fetch('origin', 'main');
      const status = await git.status();

      if (status.behind > 0) {
        console.log('Repository has changes. Updating local files...');
        await git.mergeFromTo('origin', 'main');
        //await fs.copy(path.join(localPathFront), path.join(destPathFront), { overwrite: true });
        //await copyUpdatedFiles(path.join(localPath, 'dmsback'), path.join(destPath, 'dmsback'));
      } else {
        console.log('No changes in the repository.');
      }
    } else {
      console.log('Creating directory and cloning repository...');
      fs.ensureDirSync(localPath); // Ensure the directory exists
      fs.ensureDirSync(destPath);
      fs.ensureDirSync(destPathFront);
      fs.ensureDirSync(destPathFront);

      await git.clone(repoUrl, localPath);
      //await gitClone(repoUrl, localPath);
     // await wait(10000);

      const envContent = `REACT_APP_SERVER_URL=http://${ipAddress}:3000/api/`;
      const envFilePath = path.join(localPathFront,'.env');
      fs.writeFileSync(envFilePath, envContent, 'utf8');
    }

      console.log('Running yarn install...');
      const { stdout: buildStdout1, stderr: buildStderr1 } = await execPromise('yarn install', { cwd: localPathFront });
      console.log(`yarn install output: ${buildStdout1}`);
      console.error(`yarn install stderr: ${buildStderr1}`);

      console.log('Running yarn build...');
      const { stdout: buildStdout, stderr: buildStderr } = await execPromise('yarn build', { cwd: localPathFront });
      console.log(`yarn build output: ${buildStdout}`);
      console.error(`yarn build stderr: ${buildStderr}`);

      await fs.copy(path.join(localPathFront, 'build'), destPathFront, { overwrite: true });

      await fs.copy(localPathBack, destPathBack, { overwrite: true });

      console.log('Running yarn install...');
      const { stdout, stderr } = await execPromise('yarn install', { cwd: destPathBack });
      console.log(`yarn install output: ${stdout}`);
      console.error(`yarn install stderr: ${stderr}`);

    console.log('Update completed successfully.');
  } catch (error) {
    console.error('Error updating repository:', error);
    throw error;
  }
}

// Function to get the IP address of the computer
function getIPAddress() {
  const interfaces = os.networkInterfaces();
  const interfaceNames = Object.keys(interfaces);
  for (let i = interfaceNames.length - 1; i >= 0; i--) {
    const interfaceTemp = interfaces[interfaceNames[i]];
    for (let i = 0; i < interfaceTemp.length; i++) {
      const { address, family, internal } = interfaceTemp[i];
      // Check for IPv4 and non-internal (i.e., not localhost) address
      if (family === 'IPv4' && !internal) {
        //console.log(address);
        return address;
      }
    }
  }
  return 'Unable to detect IP address';
}

module.exports = {
    cloneOrUpdateRepo,
    getIPAddress,
};

/*
app.get('/update', async (req, res) => {
  try {
    await cloneOrUpdateRepo();
    res.status(200).send('Repository checked and updated if necessary.');
  } catch (error) {
    res.status(500).send('Error updating repository: ' + error.message);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
*/
