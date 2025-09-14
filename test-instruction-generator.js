const AIInstructionGenerator = require('./backend/services/aiInstructionGenerator');

async function testInstructionGenerator() {
    console.log('🧪 Testing AI Instruction Generator...');
    
    const generator = new AIInstructionGenerator();
    
    try {
        const instructions = await generator.generateDetailedInstructions(
            'Math Tutor AI',
            'A friendly math tutor who helps students with algebra, geometry, and calculus. Always explains step-by-step solutions and encourages students to learn. Uses a patient, encouraging tone and celebrates small victories.',
            'friendly'
        );
        
        console.log('✅ Instructions generated successfully!');
        console.log('📄 Instructions:');
        console.log(instructions);
        
        const systemPrompt = generator.generateSystemPrompt(
            'Math Tutor AI',
            'A friendly math tutor who helps students with algebra, geometry, and calculus. Always explains step-by-step solutions and encourages students to learn. Uses a patient, encouraging tone and celebrates small victories.',
            instructions
        );
        
        console.log('\n🎯 System Prompt:');
        console.log(systemPrompt);
        
    } catch (error) {
        console.error('❌ Error testing instruction generator:', error);
    }
}

testInstructionGenerator();
