import fs from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';

// 使用 import.meta.url 获取当前文件的URL，然后转换为文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const ENV_FILE_PATH = join(__dirname, '.env');

export async function checkAndPromptForAPIKey() {
    const inquirer = await import('inquirer').then(module => module.default);

    // 如果.env文件存在，读取内容并检查是否有API_KEY
    if (fs.existsSync(ENV_FILE_PATH)) {
        const envContent = fs.readFileSync(ENV_FILE_PATH, 'utf-8');
        if (envContent.includes('OPENAI_API_KEY')) {
            return;
        }
    }

    // 如果上面的代码没有返回，那么我们没有找到API key，因此我们需要提示用户输入
    const questions = [
        {
            type: 'password',
            name: 'apiKey',
            message: '请输入您的 OpenAI API key:',
            validate: input => input && input.length > 0 ? true : 'API key 不能为空!'
        }
    ];

    const answers = await inquirer.prompt(questions);

    // 将API key保存到.env文件中
    fs.appendFileSync(ENV_FILE_PATH, `OPENAI_API_KEY=${answers.apiKey}\n`);
}
