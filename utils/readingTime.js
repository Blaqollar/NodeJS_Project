function calculateReadingTime(blogContent) {
    const wordsPerMinute = 200; 
    const words = blogContent.split(/\s+|[,.;!?]+/);
    const wordCount = words.length;
    const readingTimeMinutes = Math.ceil(wordCount / wordsPerMinute);
    return readingTimeMinutes;
  }
  
  module.exports = calculateReadingTime;