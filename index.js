
function generateService(answers) {
    
    if (answers.framework === 'nestjs') {
        // 使用 @nestjs/cli 生成项目
        const { execSync } = require('child_process');
        execSync('npx @nestjs/cli new my-nestjs-app');

        if (answers.database === 'mongoDB') {
            // 添加 NestJS MongoDB 模块等逻辑
            // ...
        }
        if (answers.generateCRUD) {
            // 自动生成 CRUD 接口的逻辑
            // ...
        }
    }
    // 之后可以扩展其他框架和数据库选项
}



async function main() {
    const inquirer = await import('inquirer').then(module => module.default);

    const questions = [
        {
            type: 'list',
            name: 'framework',
            message: '选择您的使用模式 please choose:',
            choices: ['新建项目(new project)','在现有项目中使用(using in existing project)'],
            default: '在现有项目中使用(using in existing project)'
        },
        {
            type: 'list',
            name: 'framework',
            message: '选择您的框架:',
            choices: ['nestjs'],
            default: 'nestjs'
        },
        {
            type: 'list',
            name: 'database',
            message: '描述你的数据层:',
            choices: ['mongoDB'],
            default: 'mongoDB'
        },
        {
            type: 'confirm',
            name: 'generateCRUD',
            message: '是否生成crud接口?',
            default: true
        }
    ];
    

    const answers = await inquirer.prompt(questions);
    // 根据用户的选择进行操作
    generateService(answers);
}

main();
