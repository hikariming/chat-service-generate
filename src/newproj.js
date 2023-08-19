import { execSync } from 'child_process';
import { config } from 'dotenv';
import { ENV_FILE_PATH } from './openaikey.js';
import OpenAI from 'openai';
import { HttpsProxyAgent } from 'https-proxy-agent'; // 使用HttpsProxyAgent而不是HttpProxyAgent


config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PROXY_URL = 'http://127.0.0.1:1087'; // 你的代理地址

export async function createNewProject(answers) {
    console.log('Creating new project...');

    // 检查 @nestjs/cli 是否已经安装
    try {
        execSync('nest --version', { stdio: 'ignore' });  // 使用 'ignore' 防止输出到控制台
    } catch (error) {
        console.error('Error: @nestjs/cli seems to be not installed. Please install it by running `npm install -g @nestjs/cli`.');
        return;
    }

    if (!OPENAI_API_KEY) {
        throw new Error("No OpenAI API key found. Please make sure it's defined in your .env file.");
    }
    const agent = new HttpsProxyAgent(PROXY_URL);

    const openai = new OpenAI({
      apiKey: OPENAI_API_KEY,
      httpAgent: agent // 将代理agent传递给OpenAI SDK

    });


    try {
        console.log('Start to chat with GPT...');
        const gptResponse = await openai.chat.completions.create({
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful assistant.'
                },
                {
                    role: 'user',
                    content: `We want to create a new NestJS project. Generate a terminal command based on the project description: ${answers.projectDescription}`
                }
            ],
            model: 'gpt-3.5-turbo', // 使用适当的模型
        });
        console.log('GPT response:', gptResponse);
    
        if (gptResponse.choices && gptResponse.choices[0] && gptResponse.choices[0].message) {
            const generatedCommand = gptResponse.choices[0].message.content.trim();
            console.log('Generated command:', generatedCommand);

            // 询问用户是否要运行此命令
            const confirmation = await inquirer.prompt([{
                type: 'confirm',
                name: 'runCommand',
                message: `Do you want to run the above command?`,
                default: false
            }]);
    
            if (confirmation.runCommand) {
                try {
                    execSync(generatedCommand);
                    console.log('Command executed successfully.');
                } catch (execError) {
                    console.error('Error executing the command:', execError);
                }
            } else {
                console.log('Command not executed.');
            }
    
        } else {
            console.error('Error fetching response from OpenAI.');
        }
    } catch (error) {
        console.error('Error calling OpenAI:', error);
    }
}
