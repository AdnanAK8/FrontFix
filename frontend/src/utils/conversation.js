function normalizeMessage(message) {
  return message.toLowerCase().trim().replace(/[^\p{L}\p{N}\s]/gu, '').replace(/\s+/g, ' ');
}

function reply(title, message) {
  return { conversational: true, title, problem: message };
}

export function matchConversationalMessage(message) {
  const normalized = normalizeMessage(message);

  const greetingPattern = /^(?:(?:h+i+|h+e+y+|h+e+l+o+)\s*)+(?:there|friend|frontfix)?$/;
  if (greetingPattern.test(normalized)) {
    const greeting = /h+e+l+o+/.test(normalized) ? 'Hello' : /h+e+y+/.test(normalized) ? 'Hey' : 'Hi';
    return reply(`${greeting} back! 👋`, `${greeting} to you too! I'm here to help you. Share a frontend error, paste a stack trace, or describe what's going wrong.`);
  }

  if (/^(?:good\s+)?(?:morning|afternoon|evening)(?:\s+there)?$/.test(normalized)) {
    return reply('Hello! 👋', "I'm here to help you with any frontend issue. What are you working on?");
  }

  if (/^(?:how are you|how are you doing|how is it going)$/.test(normalized)) {
    return reply("I'm ready to help!", 'Tell me about a frontend problem whenever you like.');
  }

  if (/^(?:whats up|what is up|nice to meet you)$/.test(normalized)) {
    return reply("Hey! I'm here and ready to help.", 'What frontend issue can I take a look at?');
  }

  if (/^(?:what can you do|how can you help|what do you help with)$/.test(normalized)) {
    return reply('I can help with frontend issues.', 'Share JavaScript, React, CSS, HTML, or API errors and I’ll walk you through a fix.');
  }

  if (/^(?:who are you|what is your name|whats your name)$/.test(normalized)) {
    return reply("I'm FrontendFix AI.", 'I help troubleshoot JavaScript, React, CSS, HTML, and API issues.');
  }

  if (/^(?:thanks|thank you|thx|ty)$/.test(normalized)) {
    return reply("You're welcome! 😊", 'If another frontend issue comes up, send it my way.');
  }

  if (/^(?:bye|goodbye|see you|talk to you later)$/.test(normalized)) {
    return reply('Goodbye! 👋', "I'll be here whenever you need help with a frontend issue.");
  }

  if (/\b(error|bug|crash|exception|stack trace|failed|failure|broken|not working|doesnt work|does not work|wont|cannot|cant|undefined|null|cors|syntaxerror|typeerror|referenceerror|misaligned|overflow|not centered|re-render|infinite loop|blank screen|white screen)\b/.test(normalized)) {
    return null;
  }

  const userText = message.trim().replace(/\s+/g, ' ');
  const quotedText = userText.length > 120 ? `${userText.slice(0, 117)}...` : userText;
  return reply('Got it!', `You said, “${quotedText}.” I'm best at frontend support, so tell me if you'd like help with a JavaScript, React, CSS, HTML, or API issue.`);
}
