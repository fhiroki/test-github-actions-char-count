const core = require('@actions/core');
const github = require('@actions/github');
const glob = require('@actions/glob');
const fs = require('fs');
const { relative } = require('path');

async function run() {
  try {
    const files = core.getInput('patterns');
    const globber = await glob.create(files);
    const filePaths = await globber.glob();

    const cwd = process.cwd();
    let total = 0;
    const rows = ['| File | Number of characters |', '| --- | ---: |'];
    for (let fp of filePaths) {
      const stats = fs.statSync(fp);
      if (!stats.isFile()) {
        core.info(`${fp} is not a file`);
        continue;
      }
      const content = fs.readFileSync(fp, 'utf8');
      const charCount = content.length;
      rows.push(`| ${relative(cwd, fp)} | ${charCount} `);
      total += charCount;
    }
    rows.push(`| Total | ${total} `);
    const body = rows.join('\n');

    const token = core.getInput('token');
    const octokit = github.getOctokit(token);
    await octokit.issues.createComment({
      owner: github.context.repo.owner,
      repo: github.context.repo.repo,
      issue_number: github.context.issue.number,
      body
    });
  } catch (e) {
    core.setFailed(e.message);
  }
}

run();
