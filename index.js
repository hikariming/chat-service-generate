import { createNewProject } from './src/newproj.js';
import { generateMongoSchema,generateCRUD } from './src/currproj.js';


async function main() {
    const inquirer = await import('inquirer').then(module => module.default);

    const questions = [
        {
            type: 'list',
            name: 'usageMode',
            message: '选择您的使用模式 please choose:',
            choices: ['新建项目(new project)', '在现有项目中使用(using in existing project)'],
            default: '在现有项目中使用(using in existing project)'
        },
        {
            type: 'input',
            name: 'projectDescription',
            message: '请描述这个新项目 (Please describe the new project):',
            when: answers => answers.usageMode === '新建项目(new project)'
        },
        {
            type: 'list',
            name: 'framework',
            message: '选择您的架构:',
            choices: ['nestjs+mongo'],
            default: 'nestjs+mongo',
            when: answers => answers.usageMode === '在现有项目中使用(using in existing project)'
        },
        {
            type: 'list',
            name: 'ChooseFunction',
            message: '选择您的功能:',
            choices: ['生成mongo schema','生成CRUD接口'],
            default: true,
            when: answers => answers.usageMode === '在现有项目中使用(using in existing project)'
        }
    ];

    const answers = await inquirer.prompt(questions);
    console.log(answers);
    // 根据用户的选择进行操作
    switch (answers.usageMode) {
        case '新建项目(new project)':
            // 如果是新项目，可能还需要询问其他问题
            createNewProject(answers);
            break;
        case '在现有项目中使用(using in existing project)':
            switch (answers.ChooseFunction) {
                case '生成mongo schema':
                    generateMongoSchema(answers);
                    break;
                case '生成CRUD接口':
                    generateCRUD(answers);
                    break;
            }
            break;
    }
    // generateService(answers);
}

main();
