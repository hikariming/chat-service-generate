import { execSync } from 'child_process';
import { config } from 'dotenv';
import { ENV_FILE_PATH } from './openaikey.js';
import OpenAIApi from 'openai';

config({ path: ENV_FILE_PATH });
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;



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
    
    const openai = new OpenAIApi({
      key: OPENAI_API_KEY
    });

    try {
        const gptResponse = await openai.complete({
            prompt: `We want create a new nestjs project,please Generate terminal command based on the project description: ${answers.projectDescription}`,
            max_tokens: 500  // 你可以根据需要调整这个
        });
    
        if (gptResponse && gptResponse.choices && gptResponse.choices[0] && gptResponse.choices[0].text) {
            const generatedCommand = gptResponse.choices[0].text.trim();
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
            console.error('Error fetching response from GPT-4.');
        }
    } catch (error) {
        console.error('Error calling OpenAI GPT-4:', error);
    }
    
}
