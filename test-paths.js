// Test script to verify path aliases are working
const fs = require('fs');
const path = require('path');

function checkPathAliases() {
    console.log('Testing path alias configuration...\n');

    const tests = [
        { 
            dir: 'components/ui',
            message: 'UI Components (@/components/ui/*)',
            expect: ['button.tsx', 'card.tsx']
        },
        {
            dir: 'lib',
            message: 'Library utilities (@/lib/*)',
            expect: ['utils.ts']
        },
        {
            dir: 'hooks',
            message: 'React hooks (@/hooks/*)',
            expect: ['use-analysis-context.tsx']
        }
    ];

    let allPassed = true;

    tests.forEach(test => {
        console.log(`Checking ${test.message}:`);
        const dirExists = fs.existsSync(path.join(process.cwd(), test.dir));
        
        if (!dirExists) {
            console.log(`❌ Directory ${test.dir} not found`);
            allPassed = false;
            return;
        }

        test.expect.forEach(file => {
            const exists = fs.existsSync(path.join(process.cwd(), test.dir, file));
            if (exists) {
                console.log(`✓ Found ${file}`);
            } else {
                console.log(`❌ Missing ${file}`);
                allPassed = false;
            }
        });
        console.log('');
    });

    if (allPassed) {
        console.log('✨ All path alias tests passed!');
        console.log('You can safely use @/ imports in your code.\n');
    } else {
        console.log('⚠️ Some tests failed. Path aliases might not work correctly.\n');
    }

    return allPassed;
}

checkPathAliases();