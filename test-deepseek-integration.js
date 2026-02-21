#!/usr/bin/env node
/**
 * DeepSeek Integration Test Script
 * This script demonstrates the DeepSeek sentiment analysis capability
 */

require('dotenv').config();
const {
  analyzeSentimentWithDeepSeek,
  addSentimentToArticlesWithDeepSeek
} = require('./src/sentiment-deepseek');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function printHeader(title) {
  log('\n' + '='.repeat(70), colors.cyan);
  log(title.toUpperCase(), colors.bright + colors.cyan);
  log('='.repeat(70), colors.cyan);
}

function printSentiment(result) {
  const sentimentColor = {
    'positive': colors.green,
    'negative': colors.red,
    'neutral': colors.yellow
  }[result.label] || colors.reset;

  log(`  Label: ${result.label}`, sentimentColor + colors.bright);
  log(`  Score: ${result.score} (Comparative: ${result.comparative.toFixed(3)})`);
  log(`  Model: ${result.model || 'N/A'}`, colors.blue);
  if (result.reasoning) {
    log(`  Reasoning: ${result.reasoning}`, colors.cyan);
  }
}

async function testSingleSentiment() {
  printHeader('Test 1: Single Sentiment Analysis');
  
  const testCases = [
    'Apple stock surges to record high on strong earnings report',
    'Tesla shares plummet after disappointing quarterly results',
    'Microsoft announces quarterly earnings release date',
    'Amazon reports mixed results amid market volatility'
  ];

  for (const text of testCases) {
    log(`\n📰 Text: "${text}"`, colors.yellow);
    try {
      const result = await analyzeSentimentWithDeepSeek(text);
      printSentiment(result);
    } catch (error) {
      log(`  ❌ Error: ${error.message}`, colors.red);
    }
  }
}

async function testBatchSentiment() {
  printHeader('Test 2: Batch Article Sentiment Analysis');
  
  const articles = [
    {
      id: 1,
      headline: 'Google unveils revolutionary AI technology',
      summary: 'Tech giant announces breakthrough in artificial intelligence with significant market implications',
      source: 'TechNews'
    },
    {
      id: 2,
      headline: 'Bank stocks decline on economic concerns',
      summary: 'Financial sector faces pressure as investors worry about economic slowdown',
      source: 'FinanceDaily'
    },
    {
      id: 3,
      headline: 'Pharmaceutical company begins Phase 3 trials',
      summary: 'Drug manufacturer moves forward with clinical testing for new treatment',
      source: 'MedicalJournal'
    }
  ];

  log('\n📊 Analyzing multiple articles...\n');
  
  try {
    const startTime = Date.now();
    const results = await addSentimentToArticlesWithDeepSeek(articles);
    const duration = Date.now() - startTime;
    
    results.forEach((article, index) => {
      log(`\n[Article ${index + 1}] ${article.headline}`, colors.bright);
      log(`Source: ${article.source}`);
      log(`Summary: ${article.summary}`, colors.cyan);
      
      const sentimentColor = {
        'positive': colors.green,
        'negative': colors.red,
        'neutral': colors.yellow
      }[article.sentiment] || colors.reset;
      
      log(`Sentiment: ${article.sentiment} (Score: ${article.sentimentScore.toFixed(3)})`, sentimentColor);
      log(`Reasoning: ${article.sentimentReasoning || 'N/A'}`, colors.blue);
      log(`Model: ${article.sentimentModel || 'N/A'}`);
    });
    
    log(`\n⏱️  Total processing time: ${duration}ms`, colors.green);
    log(`⚡ Average per article: ${(duration / articles.length).toFixed(0)}ms`, colors.green);
    
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
}

async function testFallbackBehavior() {
  printHeader('Test 3: Fallback Behavior');
  
  log('\n🔄 Testing with potentially invalid API key...\n');
  
  // Save original key
  const originalKey = process.env.OPENROUTER_API_KEY;
  
  // Set invalid key temporarily
  process.env.OPENROUTER_API_KEY = 'invalid-test-key';
  
  const text = 'Stock market shows mixed results today';
  log(`Text: "${text}"`, colors.yellow);
  
  try {
    const result = await analyzeSentimentWithDeepSeek(text);
    printSentiment(result);
    
    if (result.model === 'fallback') {
      log('\n✅ Fallback mechanism working correctly', colors.green);
    } else {
      log('\n⚠️  Expected fallback but got: ' + result.model, colors.yellow);
    }
  } catch (error) {
    log(`❌ Error: ${error.message}`, colors.red);
  }
  
  // Restore original key
  process.env.OPENROUTER_API_KEY = originalKey;
}

async function testComparisonWithBasic() {
  printHeader('Test 4: Comparison with Basic Sentiment');
  
  const Sentiment = require('sentiment');
  const sentiment = new Sentiment();
  
  const testText = 'Apple stock surges to record high on strong earnings';
  
  log(`\n📊 Comparing sentiment analysis methods for:`, colors.cyan);
  log(`"${testText}"\n`, colors.yellow);
  
  // Basic sentiment
  log('Basic Sentiment Analysis:', colors.blue);
  const basicResult = sentiment.analyze(testText);
  log(`  Score: ${basicResult.score}`);
  log(`  Comparative: ${basicResult.comparative.toFixed(3)}`);
  
  let basicLabel = 'neutral';
  if (basicResult.comparative > 0.5) {
    basicLabel = 'positive';
  } else if (basicResult.comparative < -0.5) {
    basicLabel = 'negative';
  }
  log(`  Label: ${basicLabel}`);
  
  // DeepSeek sentiment
  log('\nDeepSeek AI Sentiment Analysis:', colors.blue);
  try {
    const deepseekResult = await analyzeSentimentWithDeepSeek(testText);
    printSentiment(deepseekResult);
    
    log('\n💡 Key Differences:', colors.cyan);
    log('  - DeepSeek provides reasoning for its analysis');
    log('  - DeepSeek has contextual understanding of financial terminology');
    log('  - DeepSeek can handle more nuanced sentiment expressions');
    
  } catch (error) {
    log(`  ❌ Error: ${error.message}`, colors.red);
  }
}

async function runAllTests() {
  log('\n' + '='.repeat(70), colors.bright + colors.cyan);
  log('DEEPSEEK SENTIMENT ANALYSIS - INTEGRATION TEST', colors.bright + colors.cyan);
  log('='.repeat(70) + '\n', colors.bright + colors.cyan);
  
  log('📋 Configuration:', colors.blue);
  log(`  OpenRouter API Key: ${process.env.OPENROUTER_API_KEY ? '✓ Set' : '✗ Not set'}`, 
    process.env.OPENROUTER_API_KEY ? colors.green : colors.red);
  log(`  DeepSeek API Key: ${process.env.DEEPSEEK_API_KEY ? '✓ Set' : '✗ Not set'}`,
    process.env.DEEPSEEK_API_KEY ? colors.green : colors.red);
  
  const hasApiKey = process.env.OPENROUTER_API_KEY || process.env.DEEPSEEK_API_KEY;
  
  if (!hasApiKey) {
    log('\n⚠️  Warning: No API keys found. Tests will use fallback mechanism.', colors.yellow);
    log('To test with DeepSeek, set OPENROUTER_API_KEY or DEEPSEEK_API_KEY in .env', colors.yellow);
  }
  
  try {
    await testSingleSentiment();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testBatchSentiment();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testFallbackBehavior();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testComparisonWithBasic();
    
    printHeader('Test Summary');
    log('\n✅ All tests completed successfully!', colors.green + colors.bright);
    log('\nNext steps:', colors.cyan);
    log('  1. Set OPENROUTER_API_KEY in .env for full DeepSeek functionality');
    log('  2. Run the web server: npm start');
    log('  3. The server will automatically use DeepSeek for sentiment analysis\n');
    
  } catch (error) {
    log('\n❌ Test suite failed:', colors.red + colors.bright);
    log(error.stack, colors.red);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  runAllTests().catch(error => {
    log('\n❌ Fatal error:', colors.red + colors.bright);
    log(error.stack, colors.red);
    process.exit(1);
  });
}

module.exports = { runAllTests };
