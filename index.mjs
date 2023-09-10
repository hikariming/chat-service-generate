#!/usr/bin/env node

import { createNewProject } from './src/newproj.mjs';
import { generateMongoSchema,generateCRUD } from './src/currproj.mjs';
import { checkAndPromptForAPIKey } from './src/openaikey.mjs';

async function main() {
    await checkAndPromptForAPIKey();  // Check and prompt for API key before executing other operations
    const inquirer = await import('inquirer').then(module => module.default);

    const questions = [
        {
            type: 'list',
            name: 'usageMode',
            message: 'Please choose mode(选择您的使用模式):',
            choices: ['New project(新建项目)', 'Use in existing project(在现有项目中使用)'],
            default: 'Use in existing project(在现有项目中使用)'
        },
        {
            type: 'input',
            name: 'projectDescription',
            message: 'Describe the new project(请描述这个新项目):',
            when: answers => answers.usageMode === 'New project(新建项目)'
        },
        {
            type: 'list',
            name: 'framework',
            message: 'Choose your framework(选择您的架构):',
            choices: ['nestjs+mongo'],
            default: 'nestjs+mongo',
            when: answers => answers.usageMode === 'Use in existing project(在现有项目中使用)'
        },
        {
            type: 'list',
            name: 'ChooseFunction',
            message: 'Choose your function(选择您的功能):',
            choices: ['Generate mongo schema(生成mongo schema)', 'Generate CRUD API(生成CRUD接口)'],
            default: true,
            when: answers => answers.usageMode === 'Use in existing project(在现有项目中使用)'
        }
    ];

    const answers = await inquirer.prompt(questions);
    console.log(answers);
    // Act based on the user's choice
    switch (answers.usageMode) {
        case 'New project(新建项目)':
            // If it's a new project, you might need to ask other questions
            createNewProject(answers);
            break;
        case 'Use in existing project(在现有项目中使用)':
            switch (answers.ChooseFunction) {
                case 'Generate mongo schema(生成mongo schema)':
                    generateMongoSchema(answers);
                    break;
                case 'Generate CRUD API(生成CRUD接口)':
                    generateCRUD(answers);
                    break;
            }
            break;
    }
    // generateService(answers);
}
console.log('1111')

main();
